var express = require('express')
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);

var messages = getArrayWithLimitedLength(100);
var usersState = new Map();
var offlineUsers = [];
const KEY_SAVE_NOTE = '@bot Save note';
const KEY_BOT = '@bot';
const KEY_SHOW_NOTE = '@bot Show note';
const KEY_SHOW_LIST_NOTE = '@bot Show note list';
const KEY_DELETE_NOTE = '@bot Delete note';
const KEY_SHOW_QUOTE = '@bot Show quote';
const KEY_SHOW_ADVISE = "[#][@][)][₴][?][$][0]";
const KEY_EXCHANGE = '@bot Convert';
const KEY_WEATHER = '@bot What is the weather';
const DOLLAR = 'dollar';
const EURO = 'euro';
const UAN = 'hryvnia'
var notes = [];
var quotes = [
    "Почніть робити те, що потрібно. Потім робіть те, що можливо. І ви раптом виявите, що робите неможливе. – Св.Франциск Асізський",
    "Ніщо не є більш обтяжливим для мудрої людини і ніщо не доставляє йому більшого занепокоєння, ніж необхідність витрачати на дрібниці і непотрібні речі більше часу, ніж вони того заслуговують. – Платон",
    "Кращий спосіб почати робити – перестати говорити і почати робити. – Уолт Дісней",
    "Щаслива людина занадто задоволена сьогоденням, щоб занадто багато думати про майбутнє. – Альберт Эйнштейн",
    "Іноді щось може йти не так, як хотілося-б, але ви не повинні зупинятися. – Майкл Джордан",
    "Вірте в себе! Вірте в свої здібності! Без скромної, але розумної впевненості у своїх силах, ви не зможете бути успішним чи щасливим. – Норман Вінсент Піл",
    "Ми знаємо, хто ми є, але не знаємо, ким ми можемо бути. – Вільям Шекспір",
    "Будь собою, інші ролі зайняті. – Оскар Уайльд"
];
var advise = [
    'Випий чаю',
    'Відпочинь',
    'Послухай класичну музику',
    'Подихай свіжим повітрям',
    'Йди поїж чогось смачненького'
]
function getWeather(text) {
    let weatherEndPos = text.search("weather") + 8
    let afterDaySpacePos = text.indexOf(" ", weatherEndPos)
    let day = text.substr(weatherEndPos, afterDaySpacePos - weatherEndPos)
    let befoureCitySpacePos = afterDaySpacePos + 3;
    let city = text.substr(befoureCitySpacePos, text.indexOf("?") - befoureCitySpacePos)
    let temperature = Math.floor((Math.random() * 30) + 1);
    let temperatureState = "ok"
    if (temperature < 10) {
        temperatureState = "cold"
    } else if (temperature > 10 && temperature < 20) { temperatureState = "warm" }
    else { temperatureState = "hot" }
    newChatBotMessage(`The weather is ${temperatureState} in ${city} ${day}, temperature ${temperature} C `).send()

}
function getExchangedSumMessage(text) {
    let toPos = text.search("to")
    let currencyTo = text.substr(toPos + 2, text.length - (toPos + 2)).trim();
    let spaceBefoureStartCurrencyPos = text.lastIndexOf(' ', toPos - 2);
    let currencyFrom = text.substr(spaceBefoureStartCurrencyPos, toPos - spaceBefoureStartCurrencyPos).trim()
    let convertEndPos = text.search("Convert") + 7;
    let summStr = text.substr(convertEndPos, spaceBefoureStartCurrencyPos - convertEndPos).trim()
    let summ = parseInt(summStr)
    let result = convertCarrency(summ, currencyFrom, currencyTo);
    newChatBotMessage(`${summStr} ${currencyFrom}= ${result} ${currencyTo}`).send()
}
function getCoefficient(currency) {
    let coefficient = 1
    if (currency === DOLLAR) {
        coefficient = 26
    } else if (currency === EURO) {
        coefficient = 31
    } else {
        coefficient = 1
    }
    return coefficient;
}

function convertCarrency(amount, currencyFrom, currencyTo) {
    let result = amount * getCoefficient(currencyFrom) / getCoefficient(currencyTo)
    return result
}

function getQuote() {
    let randomQuotes = quotes[Math.floor(Math.random() * 4)];
    return randomQuotes
}
function getAdvise() {
    let randomAdvise = advise[Math.floor(Math.random() * 7)];
    return randomAdvise
}
function showNotes(text) {
    let allTogether = "";
    notes.forEach(function (element) {
        allTogether += element + "<br>"
    })
    return allTogether
}

function saveNote(text) {
    let updatedText = cutCommandFromNote(text);
    notes.push(updatedText)
}

function deleteNote(text) {
    let updatedText = cutCommandFromNote(text);
    notes.forEach(function (element) {
        if (chekIfContainWord(element, updatedText)) {
            let index = notes.indexOf(element);
            if (index > -1) {
                console.log("index  " + index)
                notes.splice(index, 1);
            }
        }
    })
}
function getNote(text) {
    let note = "Note not found";
    let updatedText = cutCommandFromNote(text);
    notes.forEach(function (element) {
        if (chekIfContainWord(element, updatedText)) {
            note = element
        }
    })
    return note
}
function chekIfContainWord(text, word) {
    let n = text.search(word)
    if (n != -1) { return true; }
    else { return false }
}
function cutCommandFromNote(text) {
    let noteStartPossition = text.search('title');
    let updatedText = text.substr(noteStartPossition, text.length - noteStartPossition);
    return updatedText
}
// Factory pattern
const newChatBotMessage = (text) => {
    const newMsgData = {
        user: { nick: KEY_BOT, name: KEY_BOT },
        text: text
    };
    return {
        send: () => {
            messages.push(newMsgData);
            io.emit('chat message', newMsgData)
        }
    }
}
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/client.js', function (req, res) {
    res.sendFile(__dirname + '/client.js');
});

io.on('connection', function (socket) {
    console.log('client connected');
    socket.on('chat message', function (msg) {
        handleMessageInAppropriateWay(msg)
    })
    socket.broadcast.emit('offlineUsersList', { offlineUsers: offlineUsers });
    socket.emit('chat history', messages);

    socket.on('login', function (data) {
        console.log('a user ' + data.userNick + ' connected');
        console.log('socket.id  ' + socket.id);
        socket.broadcast.emit('user conected', data.userNick);
        usersState.set(socket.id, data.userNick);

    });

    socket.on('disconnect', function () {
        console.log(' disconnect socket.id  ' + socket.id);
        console.log('user ' + usersState.get(socket.id) + ' disconnected');
        let nick = usersState.get(socket.id);
        offlineUsers.push(nick);
        socket.broadcast.emit('user disconected', nick);
        socket.broadcast.emit('offlineUsersList', { offlineUsers: offlineUsers })
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('start:typing', {
            userNick: data.userNick
        });
    });

    socket.on('stop typing', (data) => {
        socket.broadcast.emit('stop:typing', {
            userNick: data.userNick
        });
    });

});
// This is example of Fasade pattern
function handleMessageInAppropriateWay(msg) {
    messages.push(msg);
    io.emit('chat message', msg);
    if (chekIfContainWord(msg.text, KEY_BOT)) {
        if (chekIfContainWord(msg.text, KEY_SHOW_LIST_NOTE)) {
            newChatBotMessage(showNotes(msg.text)).send()
        } else if (chekIfContainWord(msg.text, KEY_SHOW_NOTE)) {
            newChatBotMessage(getNote(msg.text)).send()
        } else if (chekIfContainWord(msg.text, KEY_DELETE_NOTE)) {
            deleteNote(msg.text)
            newChatBotMessage("Note successfuly deleted").send()
        } else if (chekIfContainWord(msg.text, KEY_SAVE_NOTE)) {
            saveNote(msg.text)
            newChatBotMessage("Note successfuly saved").send()
        } else if (chekIfContainWord(msg.text, KEY_SHOW_QUOTE)) {
            newChatBotMessage(getQuote()).send()
        } else if (chekIfContainWord(msg.text, KEY_SHOW_ADVISE)) {
            newChatBotMessage(getAdvise()).send()
        } else if (chekIfContainWord(msg.text, KEY_EXCHANGE)) {
            getExchangedSumMessage(msg.text)
        } else if (chekIfContainWord(msg.text, KEY_WEATHER)) {
            getWeather(msg.text)
        }
    }
}

function getArrayWithLimitedLength(length) {
    var array = new Array();
    array.push = function () {
        if (this.length >= length) {
            this.shift();
        }
        return Array.prototype.push.apply(this, arguments);
    }
    return array;
}

http.listen(5000, function () {
    console.log('listening on :5000')
})