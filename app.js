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

io.on('connection', (socket) => {
    var addedUser = false;

    socket.on('get users', () => {
        return usernames;
    });

    socket.on('new message', (data) => {
        if(socket.room != 'lobby' && socket.room != 'login') return;
        socket.broadcast.to(socket.room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('add user', (username) => { // only called when user isn't in database
        if(addedUser) return;

        socket.username = username;
        socket.room = 'lobby';
        usernames[username] = username;
        numUsers++;
        addedUser = true;
        socket.join('lobby');
        socket.emit('update rooms', {
            rooms: rooms
        });
    });

    socket.on('user leave', () => {
		socket.leave(socket.room); // leave room, stored in session
        socket.join('lobby'); // joins lobby room
        socket.broadcast.to(socket.room).emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
		socket.room = newroom;
        socket.emit('updaterooms', rooms, newroom);
    });

    socket.on('user join', (newroom) => {
        socket.leave(socket.room);
		socket.join(newroom);
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
        socket.broadcast.to(socket.room).emit('typing', {
            username: socket.username
        });
    });

    socket.on('stop typing', () => {
        socket.broadcast.to(socket.room).emit('stop typing', {
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