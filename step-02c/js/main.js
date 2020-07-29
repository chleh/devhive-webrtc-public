'use strict';

const mediaStreamConstraints = {
  video: true,  // only video
};

const offerOptions = {
  offerToReceiveVideo: 1,  // exchange only video
};


const videoAlice = document.getElementById('localVideo');
const videoBob = document.getElementById('remoteVideo');
let streamAlice;

let alice;
let bob;


function l() {
    console.log.apply(console, arguments);
}

class SignalingServer {
    constructor() {
        this.clients = []
    }

    joinRoom(peer) {
        this.clients.push(peer);
        if (this.clients.length == 2) {
            this.clients[0].onRoomReady();
        }
    }

    sendOffer(origin, desc) {
        for (var c of this.clients) {
            if (c != origin) {
                c.onOffer(desc);
            }
        }
    }

    sendAnswer(origin, desc) {
        for (var c of this.clients) {
            if (c != origin) {
                c.onAnswer(desc);
            }
        }
    }

    sendIceCandidate(origin, candidate) {
        for (var c of this.clients) {
            if (c != origin) {
                c.onIceCandidateRemote(candidate);
            }
        }
    }
}

class Peer {
    constructor(name, sigServer, servers) {
        this.name = name;
        this.sigServer = sigServer;
        this.peerConn = new RTCPeerConnection(servers);
        this.peerConn.onicecandidate = this.onIceCandidateLocal.bind(this);
        this.peerConn.ontrack = this.onTrack.bind(this);
        this.peerConn.ondatachannel = this.onDataChannel.bind(this);
    }

    setVideoSink(sink) {
        this.videoSink = sink;
    }

    setDataSink(sink) {
        this.dataSink = sink;
    }

    addStream(stream) {
        this.peerConn.addStream(stream);
    }

    onIceCandidateLocal(event) {
        const iceCandidate = event.candidate;

        if (!iceCandidate) return;
        console.log(`ICE candidate ${iceCandidate.candidate} added to peer ${this.name}`);

        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        this.sigServer.sendIceCandidate(this, newIceCandidate);
    }

    onIceCandidateRemote(candidate) {
        this.peerConn.addIceCandidate(candidate);
    }

    onTrack(event) {
        if (!this.videoSink) return;
        const mediaStream = event.streams[0];
        this.videoSink.srcObject = mediaStream;
    }

    joinRoom() {
        this.sigServer.joinRoom(this);
    }

    onRoomReady() {
        this.peerConn.createOffer(offerOptions)
            .then((desc) => {
                console.log(this.name + "'s offer created");
                this.peerConn.setLocalDescription(desc);
                this.sigServer.sendOffer(this, desc);
            });
    }

    onOffer(desc) {
        this.peerConn.setRemoteDescription(desc);
        this.peerConn.createAnswer()
            .then((desc2) => {
                console.log(this.name + "'s answer created");
                this.peerConn.setLocalDescription(desc2)
                this.sigServer.sendAnswer(this, desc2);
            })
    }

    onAnswer(desc) {
        this.peerConn.setRemoteDescription(desc);
    }

    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        this.peerConn.close();
    }

    createDataChannel(channelName) {
        var constraint = null;
        this.dataChannel = this.peerConn.createDataChannel(channelName, constraint);
        this.dataChannel.onmessage = this.onMessage.bind(this);
    }

    onDataChannel(event) {
        if (this.dataChannel) return;
        this.dataChannel = event.channel;
        this.dataChannel.onmessage = this.onMessage.bind(this);
    }

    onMessage(event) {
        if (!this.dataSink) return;
        this.dataSink.value = event.data;
    }

    send(message) {
        if (!this.dataChannel) return;
        this.dataChannel.send(message);
    }
}


function startAction() {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then((mediaStream) => {
            videoAlice.srcObject = mediaStream;
            streamAlice = mediaStream;
            callButton.disabled = false;
        });
}

function callAction() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    const sigserver = new SignalingServer();

    const servers = null;  // Allows for RTC server configuration.
    alice = new Peer("Alice", sigserver, servers);
    alice.addStream(streamAlice);
    alice.createDataChannel("textChannel");
    alice.setDataSink(sendText);
    alice.joinRoom();

    bob = new Peer("Bob", sigserver, servers);
    bob.setVideoSink(videoBob);
    bob.setDataSink(receiveText);
    bob.joinRoom();
}

function hangupAction() {
    alice.close();
    alice = null;
    bob.close();
    bob = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
}

function sendAction() {
    if (!alice) return;
    alice.send(sendText.value);
}

function sendAction2() {
    if (!bob) return;
    bob.send(receiveText.value);
}


const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const sendButton = document.getElementById('sendButton');
const sendButton2 = document.getElementById('sendButton2');
const sendText = document.getElementById('localText');
const receiveText = document.getElementById('remoteText');

callButton.disabled = true;
hangupButton.disabled = true;

startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
sendButton.addEventListener('click', sendAction);
sendButton2.addEventListener('click', sendAction2);

