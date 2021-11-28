const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, getRoomUsersNumber } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = '';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinroom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        //console.log(user.id); //generate random id of 20 chars
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord',''));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`,''));
        
        io.to(user.room).emit('user-id',socket.id);

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
        });

        
    });

    // Listen for chat message
    socket.on('chatMessage', msg=> {
        const user = getCurrentUser(socket.id);
        const status = '';
        io.to(user.room).emit('message', formatMessage(user.username, msg, status));
    });

    //private message
    socket.on('privateMessage', ({msg,sendadd}) => {
        const user = getCurrentUser(socket.id);
        const status = " (Private message)";
        //console.log({msg,sendadd});
        io.to(sendadd).emit('message', formatMessage(user.username, msg, status));
        io.to(user.id).emit('message', formatMessage(user.username, msg, status));
    });

    // Runs when a client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`,''));
        }

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    socket.on('joinCall', ({roomId,uid}) => {
        const user = getCurrentUser(socket.id);
        console.log(roomId);
        socket.join(roomId);
        socket.to(uid).emit('chat-room');
        socket.emit('room_created', roomId);
      });

    socket.on('acceptCall', (roomId) => {
        console.log(`Joining room ${roomId} and emitting room_joined socket event`);
        socket.join(roomId);
        socket.emit('room_joined', roomId);
    });

    socket.on('start_call', (roomId) => {
        console.log(roomId);
        socket.broadcast.to(roomId).emit('start_call');
    });

    socket.on('webrtc_offer', (event) => {
        console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
    });

    socket.on('webrtc_answer', (event) => {
        console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
    });

    socket.on('webrtc_ice_candidate', (event) => {
        console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
        socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event);
    });
    
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));