import { __awaiter } from "tslib";
import { mungeSDPPublish } from './WowzaMungeSDP';
import WowzaPeerConnectionPublish from './WowzaPeerConnectionPublish';
import SoundMeter from './SoundMeter';
import Bowser from 'bowser';
window.AudioContext = window.AudioContext || window.webkitAudioContext || false;
export default class WowzaWebRTCPublish {
    constructor(props, callbacks) {
        this.state = {
            ready: false,
            connectionState: 'stopped',
            videoElementPublish: undefined,
            stream: undefined,
            isScreenSharing: false,
            constraints: {
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 360, ideal: 720, max: 1080 },
                    frameRate: 30,
                },
                audio: true,
            },
            sdpURL: '',
            streamInfo: {
                applicationName: '',
                streamName: '',
                sessionId: '[empty]',
            },
            mediaInfo: {
                videoBitrate: '',
                audioBitrate: '',
                videoFrameRate: '30',
                videoCodec: '42e01f',
                audioCodec: 'opus',
            },
            userData: { param1: 'value1' },
            audioEnabled: true,
            videoEnabled: true,
            useSoundMeter: false,
            cameras: [],
            microphones: [],
        };
        this.on = (_callbacks) => {
            this.callbacks = _callbacks;
        };
        this.set = (props) => __awaiter(this, void 0, void 0, function* () {
            console.log('WowzaWebRTC.set');
            console.log(props);
            let currentState = this.getState();
            let newStreamInfo = Object.assign({}, currentState.streamInfo);
            let newMediaInfo = Object.assign({}, currentState.mediaInfo);
            let newState = {};
            let constraintsChanged = false;
            if (props.videoElementPublish != null) {
                newState['videoElementPublish'] = props.videoElementPublish;
            }
            if (props.useSoundMeter != null) {
                newState['useSoundMeter'] = props.useSoundMeter;
            }
            if (props.sdpURL != null) {
                newState['sdpURL'] = props.sdpURL.trim();
            }
            if (props.applicationName != null)
                newStreamInfo['applicationName'] = props.applicationName.trim();
            if (props.streamName != null) {
                newStreamInfo['streamName'] = props.streamName.trim();
            }
            if (props.sessionId != null) {
                newStreamInfo['sessionId'] = props.sessionId;
            }
            if (props.streamInfo != null) {
                newStreamInfo = Object.assign(Object.assign({}, newStreamInfo), props.streamInfo);
            }
            newState['streamInfo'] = newStreamInfo;
            if (props.videoBitrate != null) {
                newMediaInfo.videoBitrate = props.videoBitrate;
            }
            if (props.audioBitrate != null) {
                newMediaInfo.audioBitrate = props.audioBitrate;
            }
            if (props.videoFrameRate != null) {
                newMediaInfo.videoFrameRate = props.videoFrameRate;
                newState['constraints'] = Object.assign({}, currentState.constraints);
                if (!(typeof newState['constraints']['video'] == 'boolean')) {
                    if (newMediaInfo.videoFrameRate == '')
                        delete newState['constraints']['video']['frameRate'];
                    else
                        newState['constraints']['video']['frameRate'] = props.videoFrameRate;
                }
            }
            if (props.videoCodec != null) {
                newMediaInfo.videoCodec = props.videoCodec;
            }
            if (props.audioCodec != null) {
                newMediaInfo.audioCodec = props.audioCodec;
            }
            if (props.mediaInfo != null) {
                newMediaInfo = Object.assign(Object.assign({}, newMediaInfo), props.streamInfo);
            }
            newState['mediaInfo'] = newMediaInfo;
            if (props.userData) {
                newState['userData'] = Object.assign({}, props.userData);
            }
            if (props.constraints) {
                newState['constraints'] = props.constraints;
            }
            if (newState.constraints != null &&
                JSON.stringify(currentState.constraints) !== JSON.stringify(newState.constraints)) {
                constraintsChanged = true;
            }
            try {
                let s1 = yield this.setState(newState);
                if (s1.stream === null) {
                    yield this.getUserMedia();
                }
                let s2 = yield this.getDevices();
                if (constraintsChanged && s2.stream) {
                    yield this.applyConstraints(s2.stream, s2.constraints);
                }
                return this.getState();
            }
            catch (e) {
                this.errorHandler(e);
                return null;
            }
        });
        this.getState = () => {
            return this.state;
        };
        this.setState = (newState) => {
            return new Promise((resolve, reject) => {
                this.state = Object.assign(Object.assign({}, this.state), newState);
                if (this.callbacks.onStateChanged) {
                    this.callbacks.onStateChanged(this.state);
                    resolve(this.state);
                }
                else {
                    reject('Not implemented');
                }
            });
        };
        this.start = () => {
            let currentState = this.getState();
            console.log('WowzaWebRTC.start()');
            if (!this.wowzaPeerConnectionPublish) {
                this.wowzaPeerConnectionPublish = new WowzaPeerConnectionPublish({
                    wsURL: currentState.sdpURL,
                    localStream: currentState.stream,
                    streamInfo: currentState.streamInfo,
                    mediaInfo: currentState.mediaInfo,
                    userData: currentState.userData,
                    mungeSDP: mungeSDPPublish,
                    onconnectionstatechange: this.onconnectionstatechange,
                    onstop: this.onstop,
                    onstats: this.callbacks.onStats || undefined,
                    onerror: this.errorHandler,
                });
            }
            this.wowzaPeerConnectionPublish.start();
        };
        this.stop = () => {
            console.log('WowzaWebRTC.stop()');
            this.wowzaPeerConnectionPublish.stop();
        };
        this.setAudioEnabled = (enabled) => {
            console.log('WowzaWebRTC.setAudioEnabled:' + enabled);
            this.setEnabled('audio', enabled);
            this.setState({ audioEnabled: enabled });
        };
        this.setVideoEnabled = (enabled) => {
            console.log('WowzaWebRTC.setVideoEnabled:' + enabled);
            this.setEnabled('video', enabled);
            this.setState({ videoEnabled: enabled });
        };
        this.setCamera = (id) => __awaiter(this, void 0, void 0, function* () {
            console.log('WowzaWebRTC.setCamera: ' + id);
            let _this = this;
            if (id == 'screen_screen') {
                let stream = yield this.getDisplayStream();
                let currentState = this.getState();
                this.setEnabled('audio', currentState.audioEnabled);
                this.setEnabled('video', currentState.videoEnabled);
                stream.getVideoTracks()[0].onended = function () {
                    let endedState = _this.getState();
                    if (endedState.cameras.length > 0) {
                        _this.setCamera(endedState.cameras[0].deviceId);
                    }
                };
                if (this.wowzaPeerConnectionPublish && this.wowzaPeerConnectionPublish.isStarted()) {
                    this.stop();
                    this.start();
                }
                if (this.callbacks.onCameraChanged != null) {
                    this.callbacks.onCameraChanged('screen_screen');
                }
            }
            else {
                let constraints = Object.assign({}, this.state.constraints);
                if (typeof constraints.video == 'boolean') {
                    constraints.video = {};
                }
                constraints.video = Object.assign({}, constraints.video, { deviceId: id });
                this.setState({ constraints: constraints }).then(() => {
                    this.getUserMedia('video').then((stream) => {
                        let currentState = this.getState();
                        this.setEnabled('audio', currentState.audioEnabled);
                        this.setEnabled('video', currentState.videoEnabled);
                        if (this.wowzaPeerConnectionPublish && this.wowzaPeerConnectionPublish.isStarted()) {
                            this.stop();
                            this.start();
                        }
                        if (this.callbacks.onCameraChanged != null) {
                            this.callbacks.onCameraChanged(id);
                        }
                    });
                });
            }
        });
        this.setMicrophone = (id) => {
            console.log('WowzaWebRTC.setMicrophone: ' + id);
            let constraints = Object.assign({}, this.state.constraints);
            if (typeof constraints.audio == 'boolean') {
                constraints.audio = {};
            }
            constraints.audio = Object.assign({}, constraints.audio, { deviceId: id });
            this.setState({ constraints: constraints }).then(() => {
                this.getUserMedia('audio').then((stream) => {
                    let currentState = this.getState();
                    this.setEnabled('audio', currentState.audioEnabled);
                    this.setEnabled('video', currentState.videoEnabled);
                    if (this.wowzaPeerConnectionPublish && this.wowzaPeerConnectionPublish.isStarted()) {
                        this.stop();
                        this.start();
                    }
                    if (this.callbacks.onMicrophoneChanged != null) {
                        this.callbacks.onMicrophoneChanged(id);
                    }
                });
            });
        };
        this.getDisplayStream = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let savedStream = this.getState().stream;
                const getDisplaySuccess = (stream, constraints) => {
                    let newState = { stream: stream, isScreenSharing: true };
                    if (savedStream.getAudioTracks().length > 0) {
                        stream.addTrack(savedStream.getAudioTracks()[0]);
                    }
                    try {
                        this.getState().videoElementPublish.srcObject = stream;
                        newState['ready'] = true;
                    }
                    catch (error) {
                        this.errorHandler(error);
                        reject();
                    }
                    this.setState(newState);
                    resolve(stream);
                };
                let constraints = { video: true };
                let x;
                const mediaDevices = navigator.mediaDevices;
                if (navigator.getDisplayMedia) {
                    navigator
                        .getDisplayMedia(constraints)
                        .then((stream) => {
                        getDisplaySuccess(stream, constraints);
                    })
                        .catch((e) => {
                        reject(e);
                    });
                }
                else if (mediaDevices.getDisplayMedia) {
                    mediaDevices
                        .getDisplayMedia(constraints)
                        .then((stream) => {
                        getDisplaySuccess(stream, constraints);
                    })
                        .catch((e) => {
                        reject(e);
                    });
                }
            });
        });
        this.canScreenShare = () => {
            const browser = Bowser.getParser(window.navigator.userAgent);
            let browserName = browser.getBrowser().name;
            if (browserName == 'Safari') {
                return false;
            }
            if (browserName == 'Firefox') {
                return false;
            }
            if (/mobi|android/i.test(navigator.userAgent.toLowerCase())) {
                return false;
            }
            return true;
        };
        this.applyConstraints = (stream, constraints) => {
            let promises = [];
            let audioTracks = stream.getAudioTracks();
            let videoTracks = stream.getVideoTracks();
            for (let a in audioTracks) {
                promises.push(audioTracks[a].applyConstraints(constraints.audio));
            }
            for (let v in videoTracks) {
                promises.push(videoTracks[v].applyConstraints(constraints.video));
            }
            return Promise.all(promises);
        };
        this.getUserMedia = (mediaKind) => {
            mediaKind = mediaKind || 'both';
            return new Promise((resolve, reject) => {
                console.log('WowzaWebRTCPublish.getUserMedia');
                let currentState = this.getState();
                let savedAudioTracks = [];
                let savedVideoTracks = [];
                if (currentState.stream != null) {
                    savedAudioTracks = currentState.stream.getAudioTracks();
                    savedVideoTracks = currentState.stream.getVideoTracks();
                }
                if (mediaKind != 'video') {
                    if (this.soundMeter != null) {
                        this.soundMeter.stop();
                    }
                    if (this.soundMeterInterval != null) {
                        clearInterval(this.soundMeterInterval);
                    }
                }
                if (currentState.videoElementPublish == null) {
                    reject({ message: 'videoElementPublish not set' });
                }
                const getUserMediaSuccess = (stream) => __awaiter(this, void 0, void 0, function* () {
                    if (mediaKind == 'audio' && savedVideoTracks.length > 0) {
                        let videoTracksToRemove = stream.getVideoTracks();
                        for (let i in videoTracksToRemove) {
                            stream.removeTrack(videoTracksToRemove[i]);
                        }
                        stream.addTrack(savedVideoTracks[0]);
                    }
                    else if (mediaKind == 'video' && savedAudioTracks.length > 0) {
                        let audioTracksToRemove = stream.getAudioTracks();
                        for (let j in audioTracksToRemove) {
                            stream.removeTrack(audioTracksToRemove[j]);
                        }
                        stream.addTrack(savedAudioTracks[0]);
                    }
                    let newState = { stream: stream };
                    if (mediaKind != 'audio' && currentState.isScreenSharing) {
                        for (let k in savedVideoTracks) {
                            savedVideoTracks[k].stop();
                        }
                        newState.isScreenSharing = false;
                    }
                    try {
                        currentState.videoElementPublish.srcObject = stream;
                        newState.ready = true;
                    }
                    catch (error) {
                        console.log('getUserMediaSuccess: error connecting stream to videoElementPublish, trying createObjectURL');
                        console.log(error);
                        currentState.videoElementPublish.src = window.URL.createObjectURL(stream);
                        newState.ready = true;
                    }
                    try {
                        if (mediaKind != 'video' && window.AudioContext && currentState.useSoundMeter) {
                            let audioContext = new AudioContext();
                            let soundMeter = new SoundMeter(audioContext);
                            soundMeter.connectToSource(stream, (e) => {
                                if (e) {
                                    console.log(e);
                                    return;
                                }
                                this.soundMeterInterval = setInterval(() => {
                                    let soundVal = this.getState().audioEnabled ? soundMeter.instant.toFixed(2) : 0;
                                    if (this.callbacks.onSoundMeter != null) {
                                        this.callbacks.onSoundMeter(soundVal);
                                    }
                                }, 200);
                            });
                        }
                    }
                    catch (error2) {
                        console.log('getUserMediaSuccess: error creating audio meter');
                        console.log(error2);
                    }
                    yield this.setState(newState);
                    resolve({ stream: newState.stream });
                });
                if (navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices
                        .getUserMedia(currentState.constraints)
                        .then(getUserMediaSuccess)
                        .catch(this.errorHandler);
                }
                else if (navigator.getUserMedia) {
                    navigator.getUserMedia(currentState.constraints, getUserMediaSuccess, (error) => {
                        this.errorHandler(error);
                        reject(error);
                    });
                }
                else {
                    this.errorHandler({ message: 'Your browser does not support WebRTC' });
                    reject();
                }
            });
        };
        this.getDevices = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log('WowzaWebRTCPublish.getDevices');
                    let devices = yield navigator.mediaDevices.enumerateDevices();
                    console.log(JSON.stringify(devices));
                    let constraints = Object.assign({}, this.getState().constraints);
                    let cameras = [];
                    let microphones = [];
                    devices.map((device, i) => {
                        if (device.kind == 'videoinput') {
                            if (cameras.length == 0) {
                                constraints.video = Object.assign({}, constraints.video, { deviceId: device.deviceId });
                            }
                            cameras.push(device);
                        }
                        else if (device.kind == 'audioinput') {
                            if (microphones.length == 0) {
                                constraints.audio = Object.assign({}, constraints.audio, { deviceId: device.deviceId });
                            }
                            microphones.push(device);
                        }
                    });
                    if (this.canScreenShare()) {
                        cameras.push({ deviceId: 'screen_screen', kind: 'videoinput', label: 'Screen Share' });
                    }
                    let newStateUpdate = { cameras: cameras, microphones: microphones, constraints: constraints };
                    let newState = yield this.setState(newStateUpdate);
                    resolve(newState);
                }
                catch (e) {
                    console.log('unable to detect AV devices: ' + e);
                    reject(e);
                }
            }));
        });
        this.onconnectionstatechange = (evt) => {
            if (evt.target != null && evt.target.connectionState != null) {
                this.setState({ connectionState: evt.target.connectionState });
            }
        };
        this.onstop = () => {
            this.setState({ connectionState: 'stopped' });
        };
        this.setEnabled = (trackKind, enabled) => {
            let currentState = this.getState();
            if (currentState.stream != null && currentState.stream.getTracks != null) {
                currentState.stream.getTracks().map((track) => {
                    if (track.kind == trackKind) {
                        track.enabled = enabled;
                    }
                });
            }
        };
        this.errorHandler = (error) => {
            if (error.message == null) {
                if (error.target != null) {
                    console.error('WowzaUndefinedError', 'typeof error.target: ' + typeof error.target);
                }
            }
            if (this.callbacks.onError != null) {
                this.callbacks.onError(error);
            }
        };
        if (callbacks) {
            this.on(callbacks);
        }
        if (props) {
            this.set(props);
        }
        return this;
    }
}
//# sourceMappingURL=WowzaWebRTCPublish.js.map