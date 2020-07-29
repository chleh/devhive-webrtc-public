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
let streamBob;

let peerConnectionAlice;
let peerConnectionBob;


function sendIceCandidateToOtherPeer(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (!iceCandidate) return;
    console.log(`ICE candidate ${iceCandidate.candidate} added to peer ${getName(peerConnection)}`);

    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
}

function getOtherPeer(peerConnection) {
    return (peerConnection === peerConnectionAlice) ?
        peerConnectionBob : peerConnectionAlice;
}

function getName(peerConnection) {
    return (peerConnection === peerConnectionAlice) ?
        "Alice" : "Bob";
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

    const servers = null;  // server configuration

    peerConnectionAlice = new RTCPeerConnection(servers);
    // ICE - Interactive Connection Establishment
    peerConnectionAlice.addEventListener('icecandidate', sendIceCandidateToOtherPeer);

    peerConnectionBob = new RTCPeerConnection(servers);
    peerConnectionBob.addEventListener('icecandidate', sendIceCandidateToOtherPeer);

    peerConnectionBob.addEventListener('addstream', 
        (event) => { 
            const mediaStream = event.stream;
            videoBob.srcObject = mediaStream;
            streamBob = mediaStream;
        });


    peerConnectionAlice.addStream(streamAlice);

    peerConnectionAlice.createOffer(offerOptions)
        .then((descAlice) => {
            console.log("Alice's offer created");
            peerConnectionAlice.setLocalDescription(descAlice)
            peerConnectionBob.setRemoteDescription(descAlice)

            peerConnectionBob.createAnswer()
                .then((descBob) => {
                    console.log("Bob's answer created");
                    peerConnectionBob.setLocalDescription(descBob)
                    peerConnectionAlice.setRemoteDescription(descBob)
                })
        });
}

function hangupAction() {
    peerConnectionAlice.close();

    peerConnectionAlice = null;
    peerConnectionBob = null;
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

