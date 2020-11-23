var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var roomObject = require('./rooms');

var port = process.env.PORT || 3000; //
server.listen(port, () => {
    console.log(`Server successfully running at port ${port}`);
});

app.use(express.static(path.join(__dirname, 'client')));

var usernames = {}; // going to change layout later
var rooms = {
    "Eeee": new roomObject.room("Eeee", "none", 2),
    "Best Room": new roomObject.room("Best Room", "bonk", 8),
    "Another one": new roomObject.room("Another one", "boop", 69)
};

// note: socket.room refers to room name, not room object
io.on('connection', (socket) => {
    var addedUser = false;

    socket.on('update rooms', () => { // literally just updates rooms
        socket.emit('update rooms', {
            rooms: rooms
        });
    });

    socket.on('new message', (data) => {
        if(socket.room == '^lobby' || socket.room == '^login') return;
        socket.broadcast.to(socket.room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('new user', (username) => { // only called when user isn't in database (adding user to database)
        if(addedUser) return;

        socket.username = username;
        socket.room = '^lobby';
        usernames[username] = username;
        addedUser = true;
        socket.join('^lobby');
        socket.emit('update userlist', {
            usernames: usernames
        });
        socket.emit('update rooms', {
            rooms: rooms
        });
    });

    socket.on('user join', (newroom) => { // newroom is a string
        if(!rooms[newroom].addPlayer(socket.username)) return; // if they can't be added, rip

        socket.leave(socket.room);
		socket.join(newroom);
        socket.room = newroom;
		socket.broadcast.to(newroom).emit('user joined', {
            username: socket.username,
            room: rooms[newroom]
        });
        socket.emit('login', {
            room: rooms[newroom]
        });
    });

    socket.on('user leave', () => {
        rooms[socket.room].removePlayer(socket.username);

		socket.leave(socket.room); // leave room, stored in session
        socket.join('^lobby'); // joins lobby room
        socket.broadcast.to(socket.room).emit('user left', {
            username: socket.username,
            room: rooms[socket.room]
        });
		socket.room = newroom;
        socket.emit('update rooms', {
            rooms: rooms
        });
        socket.emit('logout');
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
            delete usernames[socket.username];
            rooms[socket.room].removePlayer(socket.username);

            socket.broadcast.emit('user left', {
                username: socket.username,
                room: rooms[socket.room]
            });

            socket.emit('update userlist', {
                usernames: usernames
            });
        }
    });
});
