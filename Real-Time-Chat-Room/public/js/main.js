//import h from './helpers.js';

const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const select = document.getElementById('dropdown');
const video = document.getElementById('video');
const acc = document.getElementById('acc');
const reject = document.getElementById('reject');
const selfname = document.getElementById('selfname');


// Get username and room from URL 
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io.connect();

// video
// const mediaConstraints = {
//     audio: true,
//     video: { width: 1280, height: 720 },
// }

let rtcPeerConnection
var myStream = '';
var screen = '';
var recordedStream = [];
var mediaRecorder = ''; // Connection between the local device and the remote peer.
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
var host;
let member;
socket.on('user-id',ID=>{
    userID = ID;
    //console.log(userID);
});

// Get room and users
socket.on('roomUsers', ({ room, users}) => {
    selfname.innerText = username;
    users = users.filter(user => user.id!==userID);
    member = users.length;
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    //console.log(message);
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
    const sendadd = sendto;
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


// video call

var pc = [];
var myStream = '';
var conferenceroom;

socket.on('setVideocallOption', (flag)=>{
    if(flag==1){
        video.style = 'display:block';
    }
    else{
        video.style = 'display:none';
    }
    
});

video.addEventListener('click', async() => {
    //socket.emit('start_call', room);
    conferenceroom = 1;
    //console.log(member);
    
    socket.emit('joinCall', ({
        conferenceroom,
        sendto
    }));
});

socket.on('room_created', async () => {
    getAndSetUserStream();
    console.log('Socket event callback: room_created');
    //video.style = 'color: green';
    //await setLocalStream(mediaConstraints);
    //isCaller = 1;
});

socket.on('videocall-room',(conferenceroom) => {
    //console.log(' room_created');
    //video.style = 'display: none';
    acc.style = 'display: block; padding:5px; font-size: 18px; background-color: green; color: white';
    reject.style = 'display: block; padding:5px; font-size: 18px; background-color: red; color: white';
    acc.addEventListener('click', async() => {
        acc.style = 'display:none;';
        reject.style = 'display:none;';
        //socket.emit('start_call', room);
        conferenceroom = 1;
        //console.log(userID)
        socket.emit('acceptCall', ({
            conferenceroom, 
            receiver: userID
        }));
        getAndSetUserStream();
    });
});
  
socket.on('room_joined', (data) => {
    console.log('Socket event callback: room_joined');
    socket.emit('newuserstart', ({
        to: data.receiver,
        sender: userID
    }));
    pc.push( data.receiver );
    //console.log(pc);
    init( true, data.receiver );
    //isCaller = 0;
});

socket.on( 'newUserStart', ( data ) => {
    console.log('newUserStart') //see new user
    pc.push( data.sender );
    init( false, data.sender );
});

socket.on( 'ice candidates', async ( data ) => {
    data.candidate ? await pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
} );

socket.on( 'sdp', async ( data ) => {
    if ( data.description.type === 'offer' ) {
        data.description ? await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';
        
        getUserFullMedia().then( async ( stream ) => {
            if ( !document.getElementById( 'local' ).srcObject ) {
                setLocalStream( stream );
            }

            //save my stream
            myStream = stream;

            stream.getTracks().forEach( ( track ) => {
                pc[data.sender].addTrack( track, stream );
            } );

            let answer = await pc[data.sender].createAnswer();

            await pc[data.sender].setLocalDescription( answer );

            socket.emit( 'sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: userID } );
        } ).catch( ( e ) => {
            console.error( e );
        } );
    }

    else if ( data.description.type === 'answer' ) {
        await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
    }
} );

// chatroom functions
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
let sendto = "";
function sendadd(){
    sendto = select.value; 
}

// video call functions
function init( createOffer, partnerName ) {
    pc[partnerName] = new RTCPeerConnection( getIceServer() );

    if ( screen && screen.getTracks().length ) {
        screen.getTracks().forEach( ( track ) => {
            pc[partnerName].addTrack( track, screen );//should trigger negotiationneeded event
        } );
    }

    else if ( myStream ) {
        myStream.getTracks().forEach( ( track ) => {
            pc[partnerName].addTrack( track, myStream );//should trigger negotiationneeded event
        } );
    }

    else {
        getUserFullMedia().then( ( stream ) => {
            //save my stream
            myStream = stream;

            stream.getTracks().forEach( ( track ) => {
                pc[partnerName].addTrack( track, stream );//should trigger negotiationneeded event
            } );

            setLocalStream( stream );
        } ).catch( ( e ) => {
            console.error( `stream error: ${ e }` );
        } );
    }

    //create offer
    if ( createOffer ) {
        console.log(pc);
        pc[partnerName].onnegotiationneeded = async () => {
            let offer = await pc[partnerName].createOffer();

            await pc[partnerName].setLocalDescription( offer );

            socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: userID } );
        };
        console.log('=====');
        //console.log(pc[partnerName]);
    }

    //send ice candidate to partnerNames
    pc[partnerName].onicecandidate = ( { candidate } ) => {
        socket.emit( 'ice candidates', { candidate: candidate, to: partnerName, sender: userID } );
    };

    //add
    pc[partnerName].ontrack = ( e ) => {
        let str = e.streams[0];
        if ( document.getElementById( `${ partnerName }-video` ) ) {
            document.getElementById( `${ partnerName }-video` ).srcObject = str;
        }

        else {
            //video elem
            let newVid = document.createElement( 'video' );
            newVid.id = `${ partnerName }-video`;
            newVid.srcObject = str;
            newVid.autoplay = true;
            newVid.className = 'local-video';

            //video controls elements
            let controlDiv = document.createElement( 'div' );
            controlDiv.className = 'remote-video-controls';
            controlDiv.innerHTML = `<i id="mic" style="color: white;" class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i id="expand" style="color: white;" class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

            //create a new div for card
            let cardDiv = document.createElement( 'div' );
            cardDiv.className = 'card card-sm';
            cardDiv.id = partnerName;
            cardDiv.appendChild( newVid );
            cardDiv.appendChild( controlDiv );

            //put div in main-section elem
            document.getElementById( 'videos' ).appendChild( cardDiv );

            adjustVideoElemSize();
        }
    };

    pc[partnerName].onconnectionstatechange = ( d ) => {
        switch ( pc[partnerName].iceConnectionState ) {
            case 'disconnected':
            case 'failed':
                closeVideo( partnerName );
                break;

            case 'closed':
                closeVideo( partnerName );
                break;
        }
    };

    pc[partnerName].onsignalingstatechange = ( d ) => {
        switch ( pc[partnerName].signalingState ) {
            case 'closed':
                console.log( "Signalling state is 'closed'" );
                closeVideo( partnerName );
                break;
        }
    };
}

function getAndSetUserStream() {
    //chatContainer.style = 'display: none';
    let commElem = document.getElementsByClassName( 'room-comm' );
    //console.log(commElem.length);
    for ( let i = 0; i < commElem.length; i++ ) {
        commElem[i].attributes.removeNamedItem( 'hidden' );
    }

    getUserFullMedia().then( ( stream ) => {
        //save my stream
        myStream = stream;
        setLocalStream( stream );
    } ).catch( ( e ) => {
        console.error( `stream error: ${ e }` );
    } );
}

function getIceServer() {
    return {
        iceServers: [
            {
                urls: ["stun:eu-turn4.xirsys.com"]
            },
            {
                username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
                credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
                urls: [
                    "turn:eu-turn4.xirsys.com:80?transport=udp",
                    "turn:eu-turn4.xirsys.com:3478?transport=tcp"
                ]
            }
        ]
    };
}

function setLocalStream( stream, mirrorMode = true ) {
    const localVidElem = document.getElementById( 'local' );
    localVidElem.srcObject = stream;
}

function adjustVideoElemSize() {
    let elem = document.getElementsByClassName( 'card' );
    let totalRemoteVideosDesktop = elem.length;
    let newWidth = totalRemoteVideosDesktop <= 2 ? '50%' : (
        totalRemoteVideosDesktop == 3 ? '33.33%' : (
            totalRemoteVideosDesktop <= 8 ? '25%' : (
                totalRemoteVideosDesktop <= 15 ? '20%' : (
                    totalRemoteVideosDesktop <= 18 ? '16%' : (
                        totalRemoteVideosDesktop <= 23 ? '15%' : (
                            totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                        )
                    )
                )
            )
        )
    );


    for ( let i = 0; i < totalRemoteVideosDesktop; i++ ) {
        elem[i].style.width = newWidth;
    }
}

function getUserFullMedia() {
    if ( this.userMediaAvailable() ) {
        return navigator.mediaDevices.getUserMedia( {
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        } );
    }

    else {
        throw new Error( 'User media not available' );
    }
}

function closeVideo( elemId ) {
    if ( document.getElementById( elemId ) ) {
        document.getElementById( elemId ).remove();
        this.adjustVideoElemSize();
    }
}

function userMediaAvailable() {
    return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
}

  
