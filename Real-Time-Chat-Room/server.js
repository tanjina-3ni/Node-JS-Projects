const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

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
        //console.log(getRoomUsers('JavaScript')[0].id);

        // Welcome current user
        socket.emit('message', formatMessage(botName,'', 'Welcome to ChatCord',''));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, '', `${user.username} has joined the chat`,''));
        
        if(getRoomUsers(user.room).length>1){
            socket.to(getRoomUsers(user.room)[0].id).emit('setVideocallOption');
        }

        io.to(user.id).emit('user-id',socket.id);

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
        io.to(user.room).emit('message', formatMessage(user.username, user.id, msg, status));
    });

    //private message
    socket.on('privateMessage', ({msg,sendadd}) => {
        const user = getCurrentUser(socket.id);
        const status = " (Private message)";
        //console.log({msg,sendadd});
        // pass senders userid to detect the sender
        io.to(sendadd).emit('message', formatMessage(user.username, user.id, msg, status));
        io.to(user.id).emit('message', formatMessage(user.username, user.id, msg, status));
    });

    // Runs when a client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName,'', `${user.username} has left the chat`,''));
        }

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    // video call starts here
    socket.on('joinCall', ({conferenceroom,sendto}) => {
        const user = getCurrentUser(socket.id);
        socket.join(conferenceroom);
        if(sendto==''){
            sendto = user.room;
            io.to(user.room).emit('message', formatMessage(botName,'', `${user.username} has started video call`,''));
        }
        socket.emit('room_created');
        socket.to(sendto).emit('videocall-room',conferenceroom);
      });

    socket.on('acceptCall', (data) => {
        //console.log(`Joining room ${data.conferenceroom} and emitting room_joined socket event`);
        socket.join(data.conferenceroom);
        socket.to(data.conferenceroom).emit('room_joined', data);
    });

    socket.on('newuserstart', (data) => {
        //console.log(data)
        //console.log(room);
        socket.to( data.to ).emit( 'newUserStart', { sender: data.sender } );
    });

    socket.on( 'sdp', ( data ) => {
        //console.log('sdp')
        socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
    } );


    socket.on( 'ice candidates', ( data ) => {
        //console.log('ice candidates')
        socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
    } );
    
});

const PORT = 8000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));