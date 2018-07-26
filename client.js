var socket;
var nick;
var name;
var allUsers = [];
var offlineUsers = [];
var keypressTimeout;
var textInput = document.getElementById("messageToSent");
var typingStatus = document.getElementById("typing_status");

hideContent();

function handleMessage(message) {
    if (allUsers.length > 0) {
        if (allUsers.filter(function (e) { return e.name === message.user.name; }).length === 0) { allUsers.push(message.user); }
    }
    else { allUsers.push(message.user); }
    let text = message.text;
    const userInText = text.match(new RegExp(/@(\S+)/g));
    if (userInText && userInText[0] && userInText[0].substr(1, (userInText[0].length - 1)) === nick) {
        addSelectedMessage(message.text, message.user.name);
    } else { addMessage(message.text, message.user.name); }
    updateUsersList();

};

function updateUsersList() {
    document.getElementById('usersList').innerHTML = '';
    allUsers.forEach(user => {
        var status = "online"
        if (offlineUsers.includes(user.nick)) { status = "OFFLINE :(  :(  :(" }
        addUser(user.name, user.nick, status)
    })
};

function initSockets() {

    socket = io.connect();

    socket.on('connect', function () {
        // Send ehlo event right after connect:
        let data = { userNick: nick };
        socket.emit('login', data);
    });

    socket.on('chat history', function (messages) {
        document.getElementById('messages').innerHTML = '';
        console.log('history reseirved');
        messages.map(message => handleMessage(message));
    });

    socket.on('user disconected', function (nick) {
        document.getElementsByClassName('modal-title')[0].innerHTML = "User " + nick + " disconected";
        $("#myModal").modal()

        document.getElementsByClassName(nick)[0].innerHTML = 'jast left';
        setTimeout(() => {
            document.getElementsByClassName(nick)[0].innerHTML = 'OFFLINE :(  :(  :(';
        }, 60000)
        console.log("user disconected" + nick)
    });

    socket.on('user conected', function (nick) {
        document.getElementsByClassName(nick)[0].innerHTML = 'jast apperead';
        setTimeout(() => {
            document.getElementsByClassName(nick)[0].innerHTML = 'online';
        }, 60000);
    });

    socket.on('chat message', function (msg) {
        handleMessage(msg);
    });

    socket.on('start:typing', function (data) {
        typingStatus.innerHTML = "<p><i>" + data.userNick + " is typing message..." + "<p><i>";
    });

    socket.on('stop:typing', function (data) {
        typingStatus.innerHTML = "";
    });

    socket.on('offlineUsersList', function (data) {
        offlineUsers = data.offlineUsers;
    });
}

textInput.addEventListener('keypress', function (e, val) {
    socket.emit('typing', { userNick: nick });
    keypressTimeout = setTimeout(function () {
        clearTimeout(keypressTimeout);
        keypressTimeout = undefined;
        socket.emit('stop typing', { userNick: nick });
    }, 5000);
});
textInput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementsByClassName("fa fa-arrow-right")[0].click();
    }
});

function hideContent() {
    document.getElementsByClassName('container main-section')[0].style.visibility = 'hidden';
    document.getElementsByClassName('input-group searchbox')[0].style.visibility = 'hidden';
}

function userRegistered() {
    document.getElementsByClassName('container main-section')[0].style.visibility = 'visible';
    name = document.getElementById("username").value
    nick = document.getElementById("pass").value
    if (name === "" || nick === "") {
        document.getElementsByClassName('container main-section')[0].style.visibility = 'hidden';
    } else {
        updateHeader(name, nick);
    }
    initSockets();
}

function updateHeader(name, nick) {
    var userNameText = document.getElementById('currentUsreName');
    userNameText.innerHTML = name;

    var userNickText = document.getElementById('currentNick');
    userNickText.innerHTML = "@" + nick;
}

function createNode(element, className) {
    let node = document.createElement(element);
    node.className = className;
    return node;
}

function append(parent, el) {
    return parent.appendChild(el);
}

function createCirculeWITHlable() {
    let node = document.createElement('i');
    node.className = "fa fa-circle";
    node.setAttribute("aria-hidden", "true");
    return node
}

function addMessage(message, username) {
    var ulMessages = document.getElementById('messages');
    let div1 = createNode('div', "rightside-left-chat");
    let userNameSpan = createNode('span', "span class");
    userNameSpan.innerHTML = username + "..."
    append(userNameSpan, createCirculeWITHlable())
    let text = createNode('p', "message");
    text.innerHTML = message;
    append(div1, userNameSpan);
    append(div1, createNode('br', "br"))
    append(div1, createNode('br', "br"))
    append(div1, text);
    let listItem = createNode('li', "userItem");
    append(listItem, div1);
    append(ulMessages, listItem);
}


var ulMessages;
function addUser(username, nickName, isOnline) {
    const ul = document.getElementById('usersList');
    let div1 = createNode('div', "chat-left-img");
    let userImage = createNode('img', "image");
    userImage.src = "https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX28408818.jpg"
    append(div1, userImage);
    let div2 = createNode('div', "chat-left-detail");
    let name = createNode('p', "title class");
    name.innerHTML = username;
    let onlineSpan = createNode('span', nickName);
    onlineSpan.innerHTML = isOnline + "..."
    let nick = createNode('p', "title class");
    nick.innerHTML = '@' + nickName;
    append(onlineSpan, createCirculeWITHlable())
    append(onlineSpan, nick)
    append(div2, name);
    append(div2, onlineSpan);
    let listItem = createNode('li', "userItem");
    append(listItem, div1);
    append(listItem, div2);
    append(ul, listItem);
}

function addSelectedMessage(message, username) {
    var ulMessages = document.getElementById('messages');
    let div1 = createNode('div', "rightside-right-chat");
    let userNameSpan = createNode('span', "span class");
    userNameSpan.innerHTML = username + "..."
    append(userNameSpan, createCirculeWITHlable())
    let text = createNode('p', "message");
    text.innerHTML = message;
    append(div1, userNameSpan);
    append(div1, createNode('br', "br"))
    append(div1, createNode('br', "br"))
    append(div1, text);
    let listItem = createNode('li', "userItem");
    append(listItem, div1);
    append(ulMessages, listItem);
}

function sendMessage() {
    var data = {
        user: { nick: nick, name: name },
        text: textInput.value
    };
    textInput.value = '';
    socket.emit('chat message', data)
}
