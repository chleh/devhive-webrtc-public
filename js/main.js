'use strict';

import sendMessage from "./messageHandler";
import Session from "./session";

var localStream;
var session = new Session();
session.localVideo = document.querySelector('#localVideo');

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');
let socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  session.isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  session.isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  session.isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);

  if (message === 'got user media') {
    session.maybeStart();
  } else if (message.type === 'offer') {
    if (!session.isInitiator && !session.isStarted) {
      session.maybeStart();
    }
    console.log("try set remote desc: type offer");
    session.pc.setRemoteDescription(new RTCSessionDescription(message));
    session.doAnswer();
  } else if (message.type === 'answer' && session.isStarted) {
    console.log("try set remote desc: type answer");
    session.pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && session.isStarted) {
    addCandidate(message);
  } else if (message === 'bye' && session.isStarted) {
    session.handleRemoteHangup();
  }
});

function addCandidate(message) {
  let candidate = new RTCIceCandidate({
    sdpMLineIndex: message.label,
    candidate: message.candidate
  });
  session.pc.addIceCandidate(candidate);
}

////////////////////////////////////////////////////

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

export function getSocket() {
  return socket;
}