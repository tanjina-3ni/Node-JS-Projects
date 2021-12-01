const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const select = document.getElementById('dropdown');
const video = document.getElementById('video');
const videoChatContainer = document.getElementById('video-chat-container');
const localVideoComponent = document.getElementById('local-video');
const remoteVideoComponent = document.getElementById('remote-video');
const acc = document.getElementById('acc');
const selfname = document.getElementById('selfname');

// Get username and room from URL 
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io.connect();

// video
const mediaConstraints = {
    audio: true,
    video: { width: 1280, height: 720 },
}
let localStream
let remoteStream
let isCaller
let rtcPeerConnection // Connection between the local device and the remote peer.
//let room

// Free public STUN servers provided by Google.
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
}

let userID;
// Join chatroom
socket.on('connect',()=>{
    socket.emit('joinroom', { username, room });
    //userID = socket.io.engine.id;
})


// 
let users = [];
socket.on('user-id',ID=>{
    userID = ID;
    //console.log(userID);
});

// Get room and users
socket.on('roomUsers', ({ room, users}) => {
    selfname.innerText = username;
    users = users.filter(user => user.id!==userID);
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    // Get message
    const msg = e.target.elements.msg.value;
    //const select = e.target.elements.select;
    const sendadd = uid;
    //console.log(sendadd);
    // Emit message to server
    if (sendadd == ""){
        socket.emit('chatMessage', msg);
    }
    else {
        
        socket.emit('privateMessage', {msg, sendadd});
    }
    
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    if(userID===message.userid){
        div.innerHTML = `<div id="send-message">
            <p class="meta">${message.username} <span>${message.time}</span><span>${message.status}</span></p>
            <p class="text">
            ${message.text}
            </p>
        </div>`;
    }
    else{
        div.innerHTML = `<div id="received-message">
            <p class="meta">${message.username} <span>${message.status}</span><span>${message.time}</span></p>
            <p class="text">
            ${message.text}
            </p>
        </div>`;
    }
   
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    // for(i=0;i<users.length;i++){
    //     console.log(users[i].id);
    //     console.log(userID);
    //     if(users[i].id!=userID){
    //         console.log(users[i].username);
    //     }
    // }
    //console.log(users);
    
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
  `;
    
    const all = { id:"", username:"All" };
    users.unshift(all);

    select.innerHTML = `
        ${users.map(user => `<option value='${user.id}'>${user.username}</option>`).join('')}
    `;
    users.shift(all);
    
}

// onclick="createRoom('${user.id}');"
let uid = "";
function sendadd(){
    uid = select.value; 
}

// video call
video.addEventListener('click', async() => {
    //socket.emit('start_call', room);
    //room = 1;
    socket.emit('joinCall', ({room,uid}));
});

socket.on('myself', ()=>{
    alert('You can not call yourself');
});

socket.on('room_created', async () => {
    showVideoConference();
    console.log('Socket event callback: room_created')
    //video.style = 'color: green';
    await setLocalStream(mediaConstraints);
    isCaller = 1;
});

socket.on('chat-room', async () => {
    //console.log(' room_created')
    acc.style = 'display: block';
    acc.addEventListener('click', async() => {
        //socket.emit('start_call', room);
        //room = 1;
        socket.emit('acceptCall', room);
        showVideoConference();
    });
});
  
socket.on('room_joined', async () => {
    console.log('Socket event callback: room_joined');
    await setLocalStream(mediaConstraints);
    socket.emit('start_call', room);
    isCaller = 0;
});

socket.on('start_call', async () => {
    console.log('Socket event callback: start_call');
  
    if (isCaller==1) {
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      addLocalTracks(rtcPeerConnection);
      rtcPeerConnection.ontrack = setRemoteStream;
      rtcPeerConnection.onicecandidate = sendIceCandidate;
      await createOffer(rtcPeerConnection);
    }
});

socket.on('webrtc_offer', async (event) => {
    console.log('Socket event callback: webrtc_offer')
  
    if (isCaller==0) {
      rtcPeerConnection = new RTCPeerConnection(iceServers)
      addLocalTracks(rtcPeerConnection)
      rtcPeerConnection.ontrack = setRemoteStream
      rtcPeerConnection.onicecandidate = sendIceCandidate
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
      await createAnswer(rtcPeerConnection)
    }
});

socket.on('webrtc_answer', (event) => {
    console.log('Socket event callback: webrtc_answer')
  
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});
  
socket.on('webrtc_ice_candidate', (event) => {
    console.log('Socket event callback: webrtc_ice_candidate')

    // ICE candidate configuration.
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
    })
    rtcPeerConnection.addIceCandidate(candidate);
});
  
// video call functions
function showVideoConference() {
    chatContainer.style = 'display: none';
    videoChatContainer.style = 'display: block';
}

async function setLocalStream(mediaConstraints) {
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    } catch (error) {
      console.error('Could not get user media', error)
    }
  
    localStream = stream
    localVideoComponent.srcObject = stream
}

function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
      rtcPeerConnection.addTrack(track, localStream);
    });
}
  
async function createOffer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
        console.error(error);
    }

    socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        room,
    });
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription
    try {
      sessionDescription = await rtcPeerConnection.createAnswer()
      rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
      console.error(error)
    }
  
    socket.emit('webrtc_answer', {
      type: 'webrtc_answer',
      sdp: sessionDescription,
      room,
    });
  }

function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0];
    remoteStream = event.stream;
}
  
function sendIceCandidate(event) {
    if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
        room,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
        })
    }
}

  
