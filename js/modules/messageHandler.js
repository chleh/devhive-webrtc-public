import {getSocket} from "../main";

function sendMessage (message) {
    let socket = getSocket();
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

export {sendMessage};
