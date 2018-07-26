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
//What the weather <day> in <city>?
function getWeather(text) {
    let weatherEndPos = text.search("weather") + 8
    console.log(`weatherEndPos - ${weatherEndPos}`)
    let afterDaySpacePos = text.indexOf(" ", weatherEndPos)
    console.log(`afterDaySpacePos - ${afterDaySpacePos}`)
    let day = text.substr(weatherEndPos, afterDaySpacePos - weatherEndPos)
    console.log(`day - ${day}`)
    let befoureCitySpacePos = afterDaySpacePos + 3;
    let city = text.substr(befoureCitySpacePos, text.indexOf("?") - befoureCitySpacePos)
    console.log(`city - ${city}`)
    let temperature = Math.floor((Math.random() * 30) + 1);
    let temperatureState = "ok"
    if (temperature < 10) {
        temperatureState = "cold"
    } else if (temperature > 10 && temperature < 20) { temperatureState = "warm" }
    else { temperatureState = "hot" }
    //The weather is cold in lviv today, temperature -5 C
    sendNewChatBotMessage(`The weather is ${temperatureState} in ${city} ${day}, temperature ${temperature} C `)

}
function getExchangedSumMessage(text) {
    //find "to"
    let toPos = text.search("to")
    console.log(`toPos - ${toPos}`)
    let currencyTo = text.substr(toPos + 2, text.length - (toPos + 2)).trim();
    console.log(`currencyTo - ${currencyTo}`)
    let spaceBefoureStartCurrencyPos = text.lastIndexOf(' ', toPos - 2);
    console.log(`spaceBefoureStartCurrencyPos - ${spaceBefoureStartCurrencyPos}`)
    let currencyFrom = text.substr(spaceBefoureStartCurrencyPos, toPos - spaceBefoureStartCurrencyPos).trim()
    console.log(`currencyFrom - ${currencyFrom}`)
    let convertEndPos = text.search("Convert") + 7;
    console.log(`convertEndPos - ${convertEndPos}`)
    let summStr = text.substr(convertEndPos, spaceBefoureStartCurrencyPos - convertEndPos).trim()
    console.log(`summ - ${summStr}`)
    let summ = parseInt(summStr)
    let result = convertCarrency(summ, currencyFrom, currencyTo);
    //20 dollars = 17.0960043 euro
    sendNewChatBotMessage(`${summStr} ${currencyFrom}= ${result} ${currencyTo}`)


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

function sendNewChatBotMessage(text) {
    var newMsgData = {
        user: { nick: KEY_BOT, name: KEY_BOT },
        text: text
    };
    messages.push(newMsgData);
    io.emit('chat message', newMsgData)

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
        messages.push(msg);
        io.emit('chat message', msg);
        if (chekIfContainWord(msg.text, KEY_BOT)) {
            if (chekIfContainWord(msg.text, KEY_SHOW_LIST_NOTE)) {
                sendNewChatBotMessage(showNotes(msg.text))
            } else if (chekIfContainWord(msg.text, KEY_SHOW_NOTE)) {
                sendNewChatBotMessage(getNote(msg.text))
            } else if (chekIfContainWord(msg.text, KEY_DELETE_NOTE)) {
                deleteNote(msg.text)
                sendNewChatBotMessage("Note successfuly deleted")
            } else if (chekIfContainWord(msg.text, KEY_SAVE_NOTE)) {
                saveNote(msg.text)
                sendNewChatBotMessage("Note successfuly saved")
            } else if (chekIfContainWord(msg.text, KEY_SHOW_QUOTE)) {
                sendNewChatBotMessage(getQuote())
            } else if (chekIfContainWord(msg.text, KEY_SHOW_ADVISE)) {
                sendNewChatBotMessage(getAdvise())
            } else if (chekIfContainWord(msg.text, KEY_EXCHANGE)) {
                getExchangedSumMessage(msg.text)
            } else if (chekIfContainWord(msg.text, KEY_WEATHER)) {
                getWeather(msg.text)
            }
        }
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
function handleMessageInAppropriateWay(msg){
        messages.push(msg);
        io.emit('chat message', msg);
        if (chekIfContainWord(msg.text, KEY_BOT)) {
            if (chekIfContainWord(msg.text, KEY_SHOW_LIST_NOTE)) {
                sendNewChatBotMessage(showNotes(msg.text))
            } else if (chekIfContainWord(msg.text, KEY_SHOW_NOTE)) {
                sendNewChatBotMessage(getNote(msg.text))
            } else if (chekIfContainWord(msg.text, KEY_DELETE_NOTE)) {
                deleteNote(msg.text)
                sendNewChatBotMessage("Note successfuly deleted")
            } else if (chekIfContainWord(msg.text, KEY_SAVE_NOTE)) {
                saveNote(msg.text)
                sendNewChatBotMessage("Note successfuly saved")
            } else if (chekIfContainWord(msg.text, KEY_SHOW_QUOTE)) {
                sendNewChatBotMessage(getQuote())
            } else if (chekIfContainWord(msg.text, KEY_SHOW_ADVISE)) {
                sendNewChatBotMessage(getAdvise())
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