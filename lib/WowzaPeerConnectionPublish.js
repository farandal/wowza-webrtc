let mungeSDP;
let onconnectionstatechange;
let onstop;
let onerror;
let localStream;
let streamInfo;
let mediaInfo = {
    videoBitrate: "",
    audioBitrate: "",
    videoFrameRate: "30",
    videoCodec: "42e01f",
    audioCodec: "opus"
};
let userData;
let statsInterval;
let wsConnection;
let peerConnection;
let peerConnectionConfig = null;
let videoSender = undefined;
let audioSender = undefined;
const gotIceCandidate = (event) => {
    if (event.candidate != null) {
        console.log('WowzaPeerConnectionPublish.gotIceCandidate: ' + JSON.stringify({ 'ice': event.candidate }));
    }
};
const gotDescription = (description) => {
    console.log("WowzaPeerConnectionPublish.gotDescription: SDP:");
    console.log(description.sdp + '');
    let mungeData = new Object();
    if (mediaInfo.audioBitrate != null)
        mungeData.audioBitrate = mediaInfo.audioBitrate;
    if (mediaInfo.videoBitrate != null)
        mungeData.videoBitrate = mediaInfo.videoBitrate;
    if (mediaInfo.videoFrameRate != null)
        mungeData.videoFrameRate = mediaInfo.videoFrameRate;
    if (mediaInfo.videoCodec != null)
        mungeData.videoCodec = mediaInfo.videoCodec;
    if (mediaInfo.audioCodec != null)
        mungeData.audioCodec = mediaInfo.audioCodec;
    if (mungeSDP != null) {
        description.sdp = mungeSDP(description.sdp, mungeData);
    }
    console.log("WowzaPeerConnectionPublish.gotDescription: Setting local description SDP: ");
    console.log(description.sdp);
    peerConnection
        .setLocalDescription(description)
        .then(() => wsConnection.send('{"direction":"publish", "command":"sendOffer", "streamInfo":' + JSON.stringify(streamInfo) + ', "sdp":' + JSON.stringify(description) + ', "userData":' + JSON.stringify(userData) + '}'))
        .catch((error) => {
        let newError = Object.assign({ message: "Peer connection failed" }, error);
        errorHandler(newError);
    });
};
const createOnStats = (onStats) => {
    return () => {
        if (peerConnection != null) {
            peerConnection.getStats(null)
                .then(onStats, err => console.log(err));
        }
    };
};
const wsConnect = (url) => {
    try {
        wsConnection = new WebSocket(url);
    }
    catch (e) {
        errorHandler(e);
        return;
    }
    wsConnection.binaryType = 'arraybuffer';
    wsConnection.onopen = function () {
        console.log("WowzaPeerConnectionPublish.wsConnection.onopen");
        peerConnection = new RTCPeerConnection(peerConnectionConfig);
        videoSender = undefined;
        audioSender = undefined;
        peerConnection.onicecandidate = (event) => {
            if (event.candidate != null) {
                console.log('WowzaPeerConnectionPublish.gotIceCandidate: ' + JSON.stringify({ 'ice': event.candidate }));
            }
        };
        peerConnection.onconnectionstatechange = (event) => {
            if (onconnectionstatechange != null) {
                onconnectionstatechange(event);
            }
        };
        peerConnection.onnegotiationneeded = (event) => {
            peerConnection.createOffer();
        };
        let localTracks = localStream.getTracks();
        for (let localTrack in localTracks) {
            let sender = peerConnection.addTrack(localTracks[localTrack], localStream);
            if (localTracks[localTrack].kind === 'audio') {
                audioSender = sender;
            }
            else if (localTracks[localTrack].kind === 'video') {
                videoSender = sender;
            }
        }
    };
    wsConnection.onmessage = (evt) => {
        console.log("WowzaPeerConnectionPublish.wsConnection.onmessage: " + evt.data);
        var msgJSON = JSON.parse(evt.data);
        var msgStatus = Number(msgJSON['status']);
        var msgCommand = msgJSON['command'];
        if (msgStatus != 200) {
            stop();
            errorHandler({ message: msgJSON['statusDescription'] });
        }
        else {
            var sdpData = msgJSON['sdp'];
            if (sdpData !== undefined) {
                let mungeData = new Object();
                if (mediaInfo.audioBitrate !== undefined)
                    mungeData.audioBitrate = mediaInfo.audioBitrate;
                if (mediaInfo.videoBitrate !== undefined)
                    mungeData.videoBitrate = mediaInfo.videoBitrate;
                console.log("WowzaPeerConnectionPublish.wsConnection.onmessage: Setting remote description SDP:");
                console.log(sdpData.sdp);
                peerConnection
                    .setRemoteDescription(new RTCSessionDescription(sdpData));
            }
            var iceCandidates = msgJSON['iceCandidates'];
            if (iceCandidates !== undefined) {
                for (var index in iceCandidates) {
                    console.log('WowzaPeerConnectionPublish.wsConnection.iceCandidates: ' + iceCandidates[index]);
                    peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
                }
            }
        }
    };
    wsConnection.onclose = function () {
        console.log("WowzaPeerConnectionPublish.wsConnection.onclose");
    };
    wsConnection.onerror = function (error) {
        console.log('wsConnection.onerror');
        console.log(error);
        let message = "Websocket connection failed: " + url;
        console.log(message);
        let newError = Object.assign({ message: message }, error);
        stop();
        errorHandler(newError);
    };
};
const replaceTrack = (type, newTrack) => {
    if (peerConnection != null) {
        console.log(peerConnection);
        if (type === 'audio') {
            if (audioSender != null) {
                audioSender.replaceTrack(newTrack);
            }
            else {
                audioSender = peerConnection.addTrack(newTrack);
            }
        }
        else if (type === 'video') {
            if (videoSender != null) {
                videoSender.replaceTrack(newTrack);
            }
            else {
                videoSender = peerConnection.addTrack(newTrack);
            }
        }
    }
};
const start = (props) => {
    let wsURL = props.wsURL;
    localStream = props.localStream;
    if (props.streamInfo != null)
        streamInfo = props.streamInfo;
    if (props.mediaInfo != null)
        mediaInfo = props.mediaInfo;
    if (props.userData != null)
        userData = props.userData;
    if (props.mungeSDP != null)
        mungeSDP = props.mungeSDP;
    if (props.onconnectionstatechange != null)
        onconnectionstatechange = props.onconnectionstatechange;
    if (props.onstop != null)
        onstop = props.onstop;
    if (props.onerror != null)
        onerror = props.onerror;
    if (props.onstats != null) {
        statsInterval = setInterval(createOnStats(props.onstats), 5000);
    }
    if (peerConnection == null) {
        if (wsConnection != null)
            wsConnection.close();
        wsConnection = null;
        console.log("WowzaPeerConnectionPublish.start: wsURL:" + wsURL + " streamInfo:" + JSON.stringify(streamInfo));
        wsConnect(wsURL);
    }
    else {
        console.log('WowzaPeerConnectionPublish.start: peerConnection already in use, not starting');
    }
};
const stop = () => {
    if (peerConnection != null)
        peerConnection.close();
    peerConnection = undefined;
    videoSender = undefined;
    audioSender = undefined;
    if (wsConnection != null)
        wsConnection.close();
    wsConnection = undefined;
    if (statsInterval != null) {
        clearInterval(statsInterval);
        statsInterval = undefined;
    }
    if (onstop != null) {
        onstop();
    }
};
function isStarted() {
    return (peerConnection != null);
}
function errorHandler(error) {
    console.trace();
    if (onerror != null) {
        onerror(error);
    }
}
export default {
    connect: wsConnect,
    start: start,
    stop: stop,
    isStarted: isStarted,
    replaceTrack: replaceTrack
};
//# sourceMappingURL=WowzaPeerConnectionPublish.js.map