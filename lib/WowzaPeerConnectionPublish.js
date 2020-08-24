import { __awaiter } from "tslib";
export default class WowzaPeerConnectionPublish {
    constructor(props) {
        this.mediaInfo = {
            videoBitrate: '',
            audioBitrate: '',
            videoFrameRate: '30',
            videoCodec: '42e01f',
            audioCodec: 'opus',
        };
        this.peerConnectionConfig = null;
        this.wsConnect = (url) => {
            let _this = this;
            try {
                this.wsConnection = new WebSocket(url);
            }
            catch (e) {
                this.errorHandler(e);
                return;
            }
            this.wsConnection.binaryType = 'arraybuffer';
            this.wsConnection.onopen = function () {
                console.log('WowzaPeerConnectionPublish.wsConnection.onopen');
                _this.peerConnection = new RTCPeerConnection(_this.peerConnectionConfig);
                _this.videoSender = undefined;
                _this.audioSender = undefined;
                _this.peerConnection.onicecandidate = (event) => {
                    if (event.candidate != null) {
                        console.log('WowzaPeerConnectionPublish.gotIceCandidate: ' + JSON.stringify({ ice: event.candidate }));
                    }
                };
                _this.peerConnection.onconnectionstatechange = (event) => {
                    if (_this.onconnectionstatechange != null) {
                        _this.onconnectionstatechange(event);
                    }
                };
                _this.peerConnection.onnegotiationneeded = (event) => __awaiter(this, void 0, void 0, function* () {
                    let description = yield _this.peerConnection.createOffer();
                    _this.gotDescription(description);
                });
                let localTracks = _this.localStream.getTracks();
                for (let localTrack in localTracks) {
                    let sender = _this.peerConnection.addTrack(localTracks[localTrack], _this.localStream);
                    if (localTracks[localTrack].kind == 'audio') {
                        _this.audioSender = sender;
                    }
                    else if (localTracks[localTrack].kind == 'video') {
                        console.log('adding video sender', sender);
                        _this.videoSender = sender;
                    }
                }
            };
            this.wsConnection.onmessage = (evt) => __awaiter(this, void 0, void 0, function* () {
                console.log('WowzaPeerConnectionPublish.wsConnection.onmessage: ' + evt.data);
                var msgJSON = JSON.parse(evt.data);
                console.log('msgStatus', msgJSON.status);
                if (msgJSON.status !== 200) {
                    this.stop();
                    this.errorHandler({ message: msgJSON['statusDescription'] });
                }
                else {
                    console.error('response', msgJSON);
                    var sdpData = msgJSON.sdp;
                    console.error('sdp received', sdpData);
                    if (sdpData != undefined) {
                        let mungeData = new Object();
                        if (this.mediaInfo.audioBitrate != undefined) {
                            mungeData.audioBitrate = this.mediaInfo.audioBitrate;
                        }
                        if (this.mediaInfo.videoBitrate != undefined) {
                            mungeData.videoBitrate = this.mediaInfo.videoBitrate;
                        }
                        console.log('WowzaPeerConnectionPublish.wsConnection.onmessage: Setting remote description SDP:');
                        yield this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData));
                    }
                    var iceCandidates = msgJSON['iceCandidates'];
                    if (iceCandidates != undefined) {
                        for (var index in iceCandidates) {
                            console.log('WowzaPeerConnectionPublish.wsConnection.iceCandidates: ' + iceCandidates[index]);
                            yield this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
                        }
                    }
                }
            });
            this.wsConnection.onclose = () => {
                console.log('WowzaPeerConnectionPublish.wsConnection.onclose');
            };
            this.wsConnection.onerror = (error) => {
                console.log('wsConnection.onerror');
                console.log(error);
                let message = 'Websocket connection failed: ' + url;
                console.log(message);
                let newError = Object.assign({ message: message }, error);
                _this.stop();
                _this.errorHandler(newError);
            };
        };
        this.start = () => {
            if (this.peerConnection == null) {
                if (this.wsConnection != null) {
                    this.wsConnection.close();
                }
                this.wsConnection = null;
                console.log('WowzaPeerConnectionPublish.start: wsURL:' + this.wsURL + ' streamInfo:' + JSON.stringify(this.streamInfo));
                this.wsConnect(this.wsURL);
            }
            else {
                console.log('WowzaPeerConnectionPublish.start: peerConnection already in use, not starting');
            }
        };
        this.stop = () => {
            if (this.peerConnection != null) {
                this.peerConnection.close();
            }
            this.peerConnection = undefined;
            this.videoSender = undefined;
            this.audioSender = undefined;
            if (this.wsConnection != null) {
                this.wsConnection.close();
            }
            this.wsConnection = undefined;
            if (this.statsInterval != null) {
                clearInterval(this.statsInterval);
                this.statsInterval = undefined;
            }
            if (this.onstop != null) {
                this.onstop();
            }
        };
        this.isStarted = () => {
            return this.peerConnection != null;
        };
        this.replaceTrack = (type, newTrack) => {
            if (this.peerConnection != null) {
                if (type == 'audio') {
                    if (this.audioSender != null) {
                        this.audioSender.replaceTrack(newTrack);
                    }
                    else {
                        this.audioSender = this.peerConnection.addTrack(newTrack);
                    }
                }
                else if (type == 'video') {
                    console.log('replacing track', newTrack);
                    if (this.videoSender != null) {
                        this.videoSender.replaceTrack(newTrack);
                    }
                    else {
                        this.videoSender = this.peerConnection.addTrack(newTrack);
                    }
                }
            }
        };
        this.gotIeCandidate = (event) => {
            if (event.candidate != null) {
                console.log('WowzaPeerConnectionPublish.gotIceCandidate: ' + JSON.stringify({ ice: event.candidate }));
            }
        };
        this.gotDescription = (description) => __awaiter(this, void 0, void 0, function* () {
            console.log('WowzaPeerConnectionPublish.gotDescription: SDP:', description);
            let mungeData = new Object();
            if (this.mediaInfo.audioBitrate != null) {
                mungeData.audioBitrate = this.mediaInfo.audioBitrate;
            }
            if (this.mediaInfo.videoBitrate != null) {
                mungeData.videoBitrate = this.mediaInfo.videoBitrate;
            }
            if (this.mediaInfo.videoFrameRate != null) {
                mungeData.videoFrameRate = this.mediaInfo.videoFrameRate;
            }
            if (this.mediaInfo.videoCodec != null) {
                mungeData.videoCodec = this.mediaInfo.videoCodec;
            }
            if (this.mediaInfo.audioCodec != null) {
                mungeData.audioCodec = this.mediaInfo.audioCodec;
            }
            if (this.mungeSDP != null) {
                description.sdp = this.mungeSDP(description.sdp, mungeData);
            }
            let wsConnectionMessage = {
                direction: 'publish',
                command: 'sendOffer',
                streamInfo: this.streamInfo,
                sdp: description,
                userData: this.userData,
            };
            console.error(this.mediaInfo);
            console.log('WowzaPeerConnectionPublish.gotDescription: Setting local description SDP: ', wsConnectionMessage);
            try {
                yield this.peerConnection.setLocalDescription(description);
                console.error('sending data');
                this.wsConnection.send(JSON.stringify(wsConnectionMessage));
            }
            catch (error) {
                let newError = Object.assign({ message: 'Peer connection failed' }, error);
                this.errorHandler(newError);
            }
        });
        this.createOnStats = (onStats) => {
            return () => {
                if (this.peerConnection != null) {
                    this.peerConnection.getStats(null).then(onStats, (err) => console.error(err));
                }
            };
        };
        this.wsURL = props.wsURL;
        this.localStream = props.localStream;
        if (props.streamInfo != null) {
            this.streamInfo = props.streamInfo;
        }
        if (props.mediaInfo != null) {
            this.mediaInfo = props.mediaInfo;
        }
        if (props.userData != null) {
            this.userData = props.userData;
        }
        if (props.mungeSDP != null) {
            this.mungeSDP = props.mungeSDP;
        }
        if (props.onconnectionstatechange != null) {
            this.onconnectionstatechange = props.onconnectionstatechange;
        }
        if (props.onstop != null) {
            this.onstop = props.onstop;
        }
        if (props.onerror != null) {
            this.onerror = props.onerror;
        }
        if (props.onstats != null) {
            this.statsInterval = setInterval(this.createOnStats(props.onstats), 5000);
        }
        return this;
    }
    errorHandler(error) {
        console.trace();
        if (onerror != null) {
            onerror(error);
        }
    }
}
//# sourceMappingURL=WowzaPeerConnectionPublish.js.map