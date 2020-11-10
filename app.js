var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server successfully running at port ${port}`);
});

app.use(express.static(path.join(__dirname, 'client')));

var numUsers = 0;
var usernames = {};
var rooms = ['Room 001', 'Room 002', 'Room 003'];

var verifyUsername = (name) => {
    $.each(usernames, (key, value) => {
        if(value == name)
            return false;
    });
    return true;
}

io.on('connection', (socket) => {
    var addedUser = false;

    socket.on('new message', (data) => {
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('system message', (type) => { // broadcast a system message to client's room, pass in type of message
        socket.broadcast.to(socket.room).emit(type)
    });

    socket.on('add user', (username) => { // only called when user isn't in database
        if(addedUser) return;

        socket.username = username;
        socket.room = 'lobby';
        usernames[username] = username;
        numUsers++;
        addedUser = true;
        socket.join('lobby');
    });

    socket.on('user leave', () => {
		socket.leave(socket.room); // leave room, stored in session
		socket.join('lobby'); // joins lobby room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left.');
		socket.room = newroom;
		socket.emit('updaterooms', rooms, newroom);
    });

    socket.on('user join', (newroom) => {
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
        socket.emit('login', {
            numUsers: numUsers,
            room: socket.room
        });
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    socket.on('disconnect', () => { // when user exits tab
        if(addedUser) {
            numUsers--;
            delete usernames[socket.username];

            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});