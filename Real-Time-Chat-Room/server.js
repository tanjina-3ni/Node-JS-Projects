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
let host;
var videocallStatus = 0;
// Run when client connects
io.on('connection', socket => {
    socket.on('joinroom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        //console.log(user.id); //generate random id of 20 chars
        socket.join(user.room);
        
        // Welcome current user
        socket.emit('message', formatMessage(botName,'', 'Welcome to ChatCord',''));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, '', `${user.username} has joined the chat`,''));
        
        if(getRoomUsers(user.room).length>1){
            host = getRoomUsers(user.room)[0].id;
            
            socket.to(host).emit('setVideocallOption', 1);
        }

        io.to(user.id).emit('user-id',socket.id);

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
        });

        // when user comes after starting video call
        if(videocallStatus==1){
            io.to(user.id).emit('videocall join request');
        }
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
        if(user.id === host && getRoomUsers(user.room).length>1){
            host = getRoomUsers(user.room)[0].id;
            //console.log(host);
            socket.to(host).emit('setVideocallOption', 1);
        }

        if (user) {
            if(getRoomUsers(user.room).length==1){
                socket.to(host).emit('setVideocallOption', 0);
                videocallStatus = 0;
            }
            io.to(user.room).emit('message', formatMessage(botName,'', `${user.username} has left the chat`,''));
        }
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        
        //console.log(host);
    });


    // video call starts here
    socket.on('videocall join request', (data)=>{
        //console.log('on videocall join request');
        const user = getCurrentUser(data.id);
        socket.to(host).emit('newuser join permission',user);
    });

    socket.on('joinCall', ({conferenceroom,sendto}) => {
        //console.log('joinCall');
        const user = getCurrentUser(socket.id);
        socket.join(conferenceroom);
        //console.log(getRoomUsers(user.conferenceroom));
        if(sendto==''){
            videocallStatus = 1;
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

    socket.on('sdp', (data) => {
        //console.log('sdp')
        socket.to(data.to).emit('sdp', { description: data.description, sender: data.sender } );
    });


    socket.on('ice candidates', (data) => {
        //console.log('ice candidates')
        socket.to(data.to).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
    });
    
});

const PORT = 8000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));