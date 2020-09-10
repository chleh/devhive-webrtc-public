export function sendMessage(socket, message) {
    if(typeof(socket) === "undefined"){
        console.log('Socket is not defined', message);
        throw "Socket for sending Message not defined"
    }
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}