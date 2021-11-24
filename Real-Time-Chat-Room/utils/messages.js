const moment = require('moment');

function formatMessage(username, text, status) {
    return {
        username,
        text,
        time: moment().format('h:mm a'),
        status
    }
}

module.exports = formatMessage;