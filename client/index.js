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

var username;
var room = 'login';
var connected = false;
var typing = false;
var lastTypingTime;
var $currentInput = $usernameInput.focus();

var socket = io();

/************************ FUNCTIONS ************************/
const cleanInput = (input) => { // custom text formatter to add a message to the html
    return $('<div/>').text(input).html();
}

const joinRoom = (room) => {
    socket.emit('user join', room);
}

const leaveRoom = () => {
    socket.emit('user leave');
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
        $chatPage.show();
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();

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
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
    }

    var typingUserNameClass = data.typing ? 'typing-username' : '';
    var $usernameDiv = $('<span class="username"/>')
        .text(data.username + " ")
        .css('color', getUsernameColor(data.username))
        .addClass(typingUserNameClass);
    var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
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
        if(room != 'lobby') {
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

socket.on('login', (data) => { // after login page
    connected = true;
    log(`Hi! Welcome to Room ${data.room}`, { prepend: true }); // will have to add rooms later
    addParticipantsMessage(data);
});

socket.on('updaterooms', function(rooms, currentRoom) { // updates client's room list, on lobby page (going to have to work on later)
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
        if(value == currentRoom)
            $('#rooms').append('<div>' + value + '</div>');
        else
            $('#rooms').append('<div><a href="#" onclick="joinRoom(\''+ value + '\')">' + value + '</a></div>');
    });
});

socket.on('new message', (data) => { // new message
    addChatMessage(data);
});

socket.on('user joined', (data) => { // log somebody joining the room
    log(data.username + ' has joined the room.');
    addParticipantsMessage(data);
});

socket.on('user left', (data) => { // log somebody leaving the room
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