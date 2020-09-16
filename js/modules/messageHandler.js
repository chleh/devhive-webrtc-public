import {socket} from "./socketHandler.js";

export function sendMessage (message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}
