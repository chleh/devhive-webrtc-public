import {sendMessage} from "./modules/messageHandler.js";
import * as session from "./modules/session.js";

session.setIsChannelReady(false);
session.setIsInitiator(false);

const room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');
let socket = io.connect();
export function getSocket() {
  return socket;
}

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  session.setIsInitiator(true);
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  session.setIsChannelReady(true);
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  session.setIsChannelReady(true);
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

// This client receives a message
socket.on('message', session.messageSwitchBoard);

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(session.gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

window.onbeforeunload = function() {
  sendMessage('bye');
};
