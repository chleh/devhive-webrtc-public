import {getSocket} from "../main.js";

function sendMessage (message) {
    let socket = getSocket();
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

export {sendMessage};
