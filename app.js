var express = require('express');
var app = express();
var server = require('http').createServer(app);

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

console.log("Server started successfully");

SOCKET_LIST = {};
var io = require('socket.io')(server);
io.sockets.on('connection', (socket) => {
    console.log("New user found!");
    var socketId = Math.random();
    SOCKET_LIST[socketId] = socket;
    console.log("Socket Id of new user created: " + socket.id);

    socket.on('sendMsgToServer', (data) => { // message listener
        console.log("Someone sent a message");
        for(var i in SOCKET_LIST) { // send message to literally everyone in socket list
            SOCKET_LIST[i].emit('addToChat', data);
        }
    });

    socket.on('disconnect', () => { // when a user disconnects, remove their socket
        console.log(`User of socket id ${socket.id} disconnected.`);
        delete SOCKET_LIST[socket.id];
    });
});

let port = process.env.PORT;
if(port == null || port == " ") { // called if port uninitialized
    port = 8000;
}
server.listen(port); // use port established by vps
console.log("Successfully binded to port: " + port);