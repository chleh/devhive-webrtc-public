import {getSocket} from "./main";

export function sendMessage(message) {
    let socket = getSocket();
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}