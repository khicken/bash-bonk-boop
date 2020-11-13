var username;
var usernames = {};
var currentRoom = 'login';
var connected = false;
var typing = false;
var lastTypingTime;

var socket = io();

var joinRoom = (room) => {
    socket.emit('user join', room);
}

var leaveRoom = () => {
    socket.emit('user leave');
}

var createRoom = (data) => {

}

$(function () {
// global variables
const FADE_TIME = 250; // in ms
const TYPING_TIMER_LENGTH = 750; // in ms
const COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#39a3b6', '#c2112f', '#000000', '#78ab31',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

var $window = $(window);
var $usernameInput = $('.usernameInput');
var $messages = $('.messages');
var $inputMessage = $('.inputMessage');

var $loginPage = $('.login.page');
var $chatPage = $('.chat.page');
var $lobbyPage = $('.lobby.page');

var $currentInput = $usernameInput.focus();

/************************ FUNCTIONS ************************/
const cleanInput = (input) => { // custom text formatter to add a message to the html
    return $('<div/>').text(input).html();
}

const verifyUsername = (name) => {
    $.each(usernames, (key, value) => {
        if(value == name) return false; // if username already exists, reject it
    });
    return true;
}

const addParticipantsMessage = (data) => { // message notifying how many members in room
    var message = '';
    if(data.numUsers === 1)
        message += "There is 1 member in the room.";
    else
        message += `There are ${data.numUsers} members in the room.`;
    
    log(message);
}

const setUsername = () => { // set client's username
    username = cleanInput($usernameInput.val().trim());
    
    if(verifyUsername(username)) { // if valid username, get rid of login page
        $loginPage.fadeOut();
        $lobbyPage.show();
        $loginPage.off('click');
        currentRoom = 'lobby';

        socket.emit('add user', username); // add user to server, taking them to lobby
    }
}

const sendMessage = () => { // sends a message through chat
    var message = $inputMessage.val();
    message = cleanInput(message);

    if(message && connected) { // send if there's a message and socket connection
        $inputMessage.val('');
        addChatMessage({
            username: username,
            message: message
        });
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', message);
    }
}

const log = (message, options) => { // add system message to chat
    let $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
}

const addChatMessage = (data, options) => { // add chat message to the message list
    let $typingMessages = getTypingMessages(data);
    options = options || {};
    if($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
    }

    let typingUserNameClass = data.typing ? 'typing-username' : '';
    let $usernameDiv = $('<span class="username"/>')
        .text(data.username + " ")
        .css('color', getUsernameColor(data.username))
        .addClass(typingUserNameClass);
    let $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

    let typingClass = data.typing ? 'typing' : '';
    let $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .css('color', 'white')
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
}

const addChatTyping = (data) => { // show message for if somebody is typing
    data.typing = true;
    data.message = 'is typing...';
    addChatMessage(data);
}

const removeChatTyping = (data) => { // don't show message for if somebody is typing
    getTypingMessages(data).fadeOut(function () {
        $(this).remove();
    });
}

const addMessageElement = (el, options) => { // add options to message
    var $el = $(el);

    if(!options) options = {};
    if(typeof options.fade === 'undefined') options.fade = true;
    if(typeof options.prepend === 'undefined') options.prepend = false;

    if(options.fade)
        $el.hide().fadeIn(FADE_TIME);
    if(options.prepend)
        $messages.prepend($el);
    else
        $messages.append($el);

    $messages[0].scrollTop = $messages[0].scrollHeight;
}

const updateTyping = () => { // checks difference in time to see if user is still typing
    if(connected) {
        if(!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(() => {
            let typingTimer = (new Date()).getTime();
            let timeDiff = typingTimer - lastTypingTime;
            if(timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
}

const getTypingMessages = (data) => { // get data of who is typing
    return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
    });
}

const getUsernameColor = (username) => { // get color of a user
    let hash = 7;
    for(let i = 0; i < username.length; i++)
        hash = username.charCodeAt(i) + (hash << 5) - hash; // using random function and bit shifting to select random color every time, even with same strings
    let index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

/************************ KEY EVENTS ************************/
$window.keydown(event => { // focusing and checking key pressed
    if(!(event.ctrlKey || event.metaKey || event.altKey)) // focus input if any key is pressed other than those 3
        $currentInput.focus();

    if(event.which === 13) { // enter key pressed
        console.log(currentRoom);
        if(currentRoom != 'lobby' && currentRoom != 'login') {
            sendMessage();
            socket.emit('stop typing');
            typing = false;
        } else
            setUsername();
    }
});

$inputMessage.on('input', () => { // check for typing while there is input
    updateTyping();
});

/************************ MOUSE EVENTS ************************/
$loginPage.click(() => { // focus input when clicking on login page
    $currentInput.focus();
});

$inputMessage.click(() => { // focus input when clicking on chat input border
    $inputMessage.focus();
});

/************************ SOCKET EVENTS ************************/
socket.on('invalid username', (data) => { // if username is invalid
    $('#errorMessage').append(`<p class="error">Hey, that username doesn't work. Maybe try a different one?</p>`);
});

socket.on('login', (data) => { // called after initial join room process
    $lobbyPage.fadeOut();
    $chatPage.show();
    $lobbyPage.off('click');
    connected = true;
    currentRoom = data.room;
    log(`You have joined ${data.room}.`, { prepend: true });
    addParticipantsMessage(data);
});

socket.on('logout', () => { // called after initial join room process
    $lobbyPage.fadeOut();
    $chatPage.show();
    $lobbyPage.off('click');
    connected = false;
    currentRoom = 'lobby';
});

socket.on('update userlist', (data) => { // this is called when there is a new user/user is deleted
    usernames = data.usernames;
});

socket.on('update rooms', (data) => { // updates client's room list,
    $('#rooms').empty();
    $.each(data.rooms, function(key, value) {
        $('#rooms').append(`<div class="room-item"><a href="#" onclick="joinRoom('${value.name}')">${value.name}</a></div>`);
    });
});

socket.on('new message', (data) => { // new message
    addChatMessage(data);
});

socket.on('user joined', (data) => { // first called when somebody joins a room
    log(data.username + ' has joined the room.');
    addParticipantsMessage(data);
});

socket.on('user left', (data) => { // first called when somebody leaves the room
    log(data.username + ' has left the room.');
    addParticipantsMessage(data);
    removeChatTyping(data);
});

socket.on('typing', (data) => { // toggling the '___ is typing' in chat (on)
    addChatTyping(data);
});

socket.on('stop typing', (data) => { // toggling the '___ is typing' in chat (off)
    removeChatTyping(data);
});

socket.on('disconnect', () => { // if someone has disconnected, tell them
    log('You have been disconnected from the room.');
});

socket.on('reconnect', () => { // if someone has reconnected, tell them
    log('You have been reconnected to the room.');
    if(username)
        socket.emit('add user', {username});
});

socket.on('reconnect_error', () => {
    log('Attempt to reconnect has failed!');
});
});