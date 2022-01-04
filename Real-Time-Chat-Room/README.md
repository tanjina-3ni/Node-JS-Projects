# Chat Room

This is a real-time chat app. Connected users in a room can communicate. They can send a private message to a specific user as well. The users can make a video call in a group or person to person.

## Tools
- Node.js 
- Express 
- Socket.io 
- Vanilla JS (frontend)
- WEBRTC (for video call)

## Features
- Chat inside rooms
- Private message 
- Private video call ( both in group and Peer to Peer)

## Installation Process

- npm install
- npm install express socket.io moment 
- npm install -D nodemon 

## How To run

- nodemon server.js <br>
OR <br>
- npm run dev <br>

## Description

In this short project, Chatroom concept has been implemented using nodejs. Here people can join in different room to communicate. For example, a company is taking interview for different posts of IT sector. Some jobseekers have applied for the post of Javascript and the company wants to keep them in seperate room. So, javascript people will join in javascript room, python people will join in python and so on.

<br><br>
<p align="center"><img src="https://github.com/tanjina-3ni/Node-JS-Projects/blob/main/Real-Time-Chat-Room/Images/Screenshot%20(9).png" alt="cplusplus" width="450" height="300"/></p>
<p align="center">Fig 1: Join in room</p> <br>

In this project, users can select different rooms by clicking the dropdown bar and they have to fill up the name field. After joining the room, they will get a welcome message and the other people in the room will receive a message that who has joined the chat. The name of the users in the room will be displayed in the user list (left sidebar) and the user dropdown list (bottom right). In this room, they can send a message or create video conferences in groups as well as in private. But by default video call button will be shown only for the first joined user. After the first user leaves the room, the second user will be the host and he will have the video call button. To call/ send a message in private they have to select the specific user from the bottom right user dropdown list.

<br><br>
<p align="center"><img src="https://github.com/tanjina-3ni/Node-JS-Projects/blob/main/Real-Time-Chat-Room/Images/Screenshot%20(10).png" alt="cplusplus" width="800" height="700"/></p>
<p align="center">Fig 2: Frist user in the room</p> <br>

The first user joined in the room will get a welcome message and the user list is empty. After joining the second user, he will get a welcome message and the name of the first user will be displayed on the user list (right sidebar) and the dropdown list (bottom right).

<br><br>
<p align="center"><img src="https://github.com/tanjina-3ni/Node-JS-Projects/blob/main/Real-Time-Chat-Room/Images/Screenshot%20(11).png" alt="cplusplus" width="800" height="700"/></p>
<p align="center">Fig 2: Second user in the room</p> <br>

The first user will get a message that the second user has joined and the name of the second user will be displayed on the user list (left sidebar) and the dropdown list (bottom right).

<br><br>
<p align="center"><img src="https://github.com/tanjina-3ni/Node-JS-Projects/blob/main/Real-Time-Chat-Room/Images/Screenshot%20(12).png" alt="cplusplus" width="800" height="700"/></p>
<p align="center">Fig 2: Frist user after joinning second user in the room</p> <br>


## References

- [Chat room](https://github.com/bradtraversy/chatcord)
- [Video call](https://github.com/amirsanni/Video-Call-App-NodeJS)
