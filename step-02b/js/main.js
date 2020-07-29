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
    }

    setVideoSink(sink) {
        this.videoSink = sink;
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
        this.peerConn.close();
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
    alice.joinRoom();

    var bob = new Peer("Bob", sigserver, servers);
    bob.setVideoSink(videoBob);
    bob.joinRoom();
}

function hangupAction() {
    alice.close();
    hangupButton.disabled = true;
    callButton.disabled = false;
}


const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;

startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

