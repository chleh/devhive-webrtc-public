import {createPeerConnection} from "./peerConnectionHandler";
import {sendMessage} from "./messageHandler";

export default class Session  {
    isChannelReady = false;
    isInitiator = false;
    isStarted = false;
    pc;
    localStream;
    localVideo;
    handleRemoteHangup() {
        console.log('Session terminated.');
        this.stop();
        this.isInitiator = true;
        this.isChannelReady = false;
        this.gotStream(this.localStream);
    };
    stop() {
        this.isStarted = false;
        this.pc.close();
        this.pc = null;
    };
    maybeStart() {
        console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
        if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
            console.log('>>>>>> creating peer connection');
            this.pc = createPeerConnection();
            this.pc.addStream(this.localStream);
            this.isStarted = true;
            console.log('isInitiator', this.isInitiator);
            if (this.isInitiator) {
                this.doCall();
            }
        }
    };
    gotStream(stream) {
        console.log('Adding local stream.');
        this.localStream = stream;
        this.localVideo.srcObject = stream;
        sendMessage('got user media');
        if (this.isInitiator) {
            this.maybeStart();
        }
    };
    doCall() {
        console.log('Sending offer to peer');
        this.pc.createOffer(this.setDescription, this.handleCreateOfferError);
    };
    doAnswer() {
        console.log('Sending answer to peer.');
        this.pc.createAnswer().then(
            this.setDescription,
            this.onCreateSessionDescriptionError
        );
    };
    /**
     * sets local description and sends new message to server
     *
     * @param sessionDescription
     */
    setDescription(sessionDescription) {
        this.pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        sendMessage(sessionDescription);
    };
    onCreateSessionDescriptionError(error) {
        trace('Failed to create session description: ' + error.toString());
    };
    handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    };
}
