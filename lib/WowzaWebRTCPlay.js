import { mungeSDPPlay } from './WowzaMungeSDP';
import WowzaPeerConnectionPlay from './WowzaPeerConnectionPlay';
let state = {
    connectionState: 'stopped',
    videoElementPlay: undefined,
    sdpURL: '',
    streamInfo: {
        applicationName: "",
        streamName: "",
        sessionId: "[empty]"
    },
    userData: { param1: "value1" }
};
let wowzaPeerConnectionPlay;
let callbacks;
const setState = (newState) => {
    return new Promise((resolve, reject) => {
        state = Object.assign(Object.assign({}, state), newState);
        if (callbacks.onStateChanged != null) {
            callbacks.onStateChanged(state);
        }
        resolve(state);
    });
};
const getState = () => {
    return state;
};
const onconnectionstatechange = (evt) => {
    if (evt.target != null && evt.target.connectionState != null) {
        let connectionState = evt.target.connectionState;
        let newState = { connectionState: connectionState };
        setState(newState);
    }
};
const onstop = () => {
    setState({ connectionState: 'stopped' });
};
const on = (_callbacks) => {
    callbacks = _callbacks;
};
const set = (props) => {
    return new Promise((resolve, reject) => {
        let currentState = getState();
        let newStreamInfo = Object.assign({}, currentState.streamInfo);
        let newState;
        if (props.videoElementPlay != null)
            newState['videoElementPlay'] = props.videoElementPlay;
        if (props.sdpURL != null)
            newState['sdpURL'] = props.sdpURL.trim();
        if (props.applicationName != null)
            newStreamInfo['applicationName'] = props.applicationName.trim();
        if (props.streamName != null)
            newStreamInfo['streamName'] = props.streamName.trim();
        if (props.sessionId != null)
            newStreamInfo['sessionId'] = props.sessionId;
        if (props.streamInfo != null)
            newStreamInfo = Object.assign(Object.assign({}, newStreamInfo), props.streamInfo);
        newState['streamInfo'] = newStreamInfo;
        if (props.userData != null)
            newState['userData'] = Object.assign({}, props.userData);
        setState(newState)
            .then((s) => {
            resolve(s);
        });
    });
};
const getAvailableStreams = () => {
    let currentState = getState();
    wowzaPeerConnectionPlay = new WowzaPeerConnectionPlay({
        sdpURL: currentState.sdpURL,
        videoElement: currentState.videoElementPlay,
        streamInfo: currentState.streamInfo,
        userData: currentState.userData,
        mungeSDP: mungeSDPPlay,
        onconnectionstatechange: onconnectionstatechange,
        onstop: onstop,
        onerror: errorHandler
    });
    return (wowzaPeerConnectionPlay.getAvailableStreams());
};
const play = () => {
    let currentState = getState();
    wowzaPeerConnectionPlay = new WowzaPeerConnectionPlay({
        sdpURL: currentState.sdpURL,
        videoElement: currentState.videoElementPlay,
        streamInfo: currentState.streamInfo,
        userData: currentState.userData,
        mungeSDP: mungeSDPPlay,
        onconnectionstatechange: onconnectionstatechange,
        onstop: onstop,
        onerror: errorHandler
    });
    wowzaPeerConnectionPlay.start();
};
const stop = () => {
    wowzaPeerConnectionPlay.stop();
    wowzaPeerConnectionPlay = undefined;
};
const errorHandler = (error) => {
    console.log('WowzaWebRTCPlay ERROR:');
    console.log(error);
    if (error.message == null) {
        if (error.target != null) {
            console.log('typeof error.target: ' + typeof error.target);
        }
    }
    let newError = Object.assign({}, error);
    if (callbacks.onError != null) {
        callbacks.onError(error);
    }
};
let WowzaWebRTCPlay = {
    on: on,
    set: set,
    getState: getState,
    getAvailableStreams: getAvailableStreams,
    play: play,
    stop: stop
};
export default WowzaWebRTCPlay;
//# sourceMappingURL=WowzaWebRTCPlay.js.map