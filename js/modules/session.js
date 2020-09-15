import {createPeerConnection} from "./peerConnectionHandler.js";
import {sendMessage} from "./messageHandler.js";

export var isChannelReady;
export var isInitiator;
export var isStarted = false;
export var pc;
var localStream;
var localVideo = document.querySelector('#localVideo');

export function setIsChannelReady(value) {
    isChannelReady = value;
}

export function setIsInitiator(value) {
    isInitiator = value;
}

export function handleRemoteHangup() {
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

export function maybeStart() {
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

export function doAnswer() {
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
