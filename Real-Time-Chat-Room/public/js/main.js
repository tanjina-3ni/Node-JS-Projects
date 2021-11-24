const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const select = document.getElementById('dropdown');

// Get username and room from URL 
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();

// Join chatroom
socket.emit('joinroom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    console.log('ok');
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
    if(username===message.username){
        div.innerHTML = `<div id="send-message">
            <p class="meta">Me (${message.username}) <span>${message.time}</span><span>${message.status}</span></p>
            <p class="text">
            ${message.text}
            </p>
        </div>`;
    }
    else{
        div.innerHTML = `<div id="received-message">
            <p class="meta">${message.username} <span>${message.time}</span><span>${message.status}</span></p>
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

