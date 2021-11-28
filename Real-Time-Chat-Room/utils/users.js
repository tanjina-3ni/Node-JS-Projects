const users = []

// Join user to chat
function userJoin(id, username, room) {
    const user = { id, username, room };

    users.push(user);
    return user;
}

// Get current user
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

// Get room users
function getRoomUsers(room) {
    const usersofRoom = users.filter(user => user.room === room);
    return usersofRoom;
}

// Get number of users in room
function getRoomUsersNumber(room) {
    const usersofRoom = users.filter(user => user.room === room);
    const number = usersofRoom.length;
    return number;
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getRoomUsersNumber
}