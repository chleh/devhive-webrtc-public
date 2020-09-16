import {createPeerConnection} from "./peerConnectionHandler.js";
import {sendMessage} from "./messageHandler.js";

var isChannelReady = false;
export function setIsChannelReady(value) { isChannelReady = value; }
var isInitiator = false;
export function setIsInitiator(value) { isInitiator = value; }
var isStarted = false;
var pc;
let localStream;
const localVideo = document.querySelector('#localVideo');


export function messageSwitchBoard(message) {
    console.log('Client received message:', message);

    if (message === 'got user media') {
        maybeStart();
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            maybeStart();
        }
        console.log("try set remote desc: type offer");
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStarted) {
        console.log("try set remote desc: type answer");
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
        addCandidate(message);
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
}

function addCandidate(message) {
    let candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = true;
    isChannelReady = false;
    gotStream(localStream);
}

function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        pc = createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}

export function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media');
    if (isInitiator) {
        maybeStart();
    }
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setDescription, handleCreateOfferError);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setDescription,
        onCreateSessionDescriptionError
    );
}

 /**
 * sets local description and sends new message to server
 *
 * @param sessionDescription
 */
function setDescription(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}
