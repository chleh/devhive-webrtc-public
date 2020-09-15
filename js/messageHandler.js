import {getSocket} from "./main";

export default function (message) {
    let socket = getSocket();
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}