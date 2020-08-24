/*
 * This code and all components (c) Copyright 2019-2020, Wowza Media Systems, LLC. All rights reserved.
 * This code is licensed pursuant to the BSD 3-Clause License.
 *
 * Typescript implementation by @farandal - Francisco Aranda - farandal@gmail.com - http://linkedin.com/in/farandal
 *
 */

 import { IStreamInfo, IMediaInfo } from './interfaces';

 interface IProps {
   wsURL: any;
   localStream: MediaStream;
   streamInfo?: IStreamInfo;
   mediaInfo?: {
     videoBitrate: string;
     audioBitrate: string;
     videoFrameRate: string;
     videoCodec: string;
     audioCodec: string;
   };
   userData: any;
   mungeSDP: Function; //  mungeSDP: function (sdpStr, mungeData)
   onconnectionstatechange: Function;
   onstop: Function;
   onerror: Function;
   onstats: Function;
 }
 
 export default class WowzaPeerConnectionPublish {
   // munge plug-in
   private mungeSDP: Function;
 
   // callbacks
   private onconnectionstatechange: Function;
   private onstop: Function;
   private onerror: Function;
 
   // local state
   private localStream: MediaStream;
   private streamInfo: IStreamInfo;
 
   private mediaInfo: IMediaInfo = {
     videoBitrate: '',
     audioBitrate: '',
     videoFrameRate: '30',
     videoCodec: '42e01f',
     audioCodec: 'opus',
   };
 
   private userData: any;
   private statsInterval: ReturnType<typeof setTimeout>;
 
   public wsConnection: WebSocket;
   public peerConnection: RTCPeerConnection;
   //let peerConnectionConfig:{iceServers: any[]} = { 'iceServers': [] };
   private peerConnectionConfig: { iceServers: any[] } = null;
   public videoSender: RTCRtpSender;
   public audioSender: RTCRtpSender;
 
   private wsURL: string;
 
   public wsConnect = (url: string) => {
     let _this = this;
 
     try {
       this.wsConnection = new WebSocket(url);
     } catch (e) {
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
 
       // Experimental API, no type defined for event in mozilla
       _this.peerConnection.onnegotiationneeded = async (event: any) => {
         let description: RTCSessionDescriptionInit = await _this.peerConnection.createOffer();
         _this.gotDescription(description);
       };
 
       let localTracks = _this.localStream.getTracks();
 
       for (let localTrack in localTracks) {
         let sender = _this.peerConnection.addTrack(localTracks[localTrack] as MediaStreamTrack, _this.localStream);
         if (localTracks[localTrack].kind == 'audio') {
           _this.audioSender = sender;
         } else if (localTracks[localTrack].kind == 'video') {
           console.log('adding video sender', sender);
           _this.videoSender = sender;
         }
       }
     };
 
     this.wsConnection.onmessage = async (evt: MessageEvent) => {
       console.log('WowzaPeerConnectionPublish.wsConnection.onmessage: ' + evt.data);
 
       var msgJSON = JSON.parse(evt.data);
 
       //var msgStatus = Number(msgJSON['status']);
       //var msgCommand = msgJSON['command'];
       console.log('msgStatus', msgJSON.status);
 
       if (msgJSON.status !== 200) {
         this.stop();
         this.errorHandler({ message: msgJSON['statusDescription'] });
       } else {
         console.error('response', msgJSON);
         var sdpData = msgJSON.sdp;
         console.error('sdp received', sdpData);
         if (sdpData != undefined) {
           let mungeData: any = new Object();
 
           if (this.mediaInfo.audioBitrate != undefined) {
             mungeData.audioBitrate = this.mediaInfo.audioBitrate;
           }
           if (this.mediaInfo.videoBitrate != undefined) {
             mungeData.videoBitrate = this.mediaInfo.videoBitrate;
           }
 
           console.log('WowzaPeerConnectionPublish.wsConnection.onmessage: Setting remote description SDP:');
           //console.log(sdpData.sdp);
 
           // setRemoteDescription does not allow second argumment nor errorHandler
           /* peerConnection
           .setRemoteDescription(new RTCSessionDescription(sdpData),
             () => { },
             errorHandler
           );*/
 
           await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData));
         }
 
         var iceCandidates = msgJSON['iceCandidates'];
         if (iceCandidates != undefined) {
           for (var index in iceCandidates) {
             console.log('WowzaPeerConnectionPublish.wsConnection.iceCandidates: ' + iceCandidates[index]);
             await this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
           }
         }
       }
     };
 
     this.wsConnection.onclose = () => {
       console.log('WowzaPeerConnectionPublish.wsConnection.onclose');
     };
 
     this.wsConnection.onerror = (error) => {
       console.log('wsConnection.onerror');
       console.log(error);
       let message = 'Websocket connection failed: ' + url;
       console.log(message);
       let newError = { message: message, ...error };
       _this.stop();
       _this.errorHandler(newError);
     };
   };
 
   constructor(props?: IProps) {
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
 
   public start = () => {
     if (this.peerConnection == null) {
       if (this.wsConnection != null) {
         this.wsConnection.close();
       }
       this.wsConnection = null;
 
       console.log(
         'WowzaPeerConnectionPublish.start: wsURL:' + this.wsURL + ' streamInfo:' + JSON.stringify(this.streamInfo)
       );
 
       this.wsConnect(this.wsURL);
     } else {
       console.log('WowzaPeerConnectionPublish.start: peerConnection already in use, not starting');
     }
   };
 
   public stop = () => {
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
 
   public isStarted = (): boolean => {
     return this.peerConnection != null;
   };
 
   public replaceTrack = (type: string, newTrack: MediaStreamTrack) => {
     if (this.peerConnection != null) {
       if (type == 'audio') {
         if (this.audioSender != null) {
           this.audioSender.replaceTrack(newTrack);
         } else {
           this.audioSender = this.peerConnection.addTrack(newTrack);
         }
       } else if (type == 'video') {
         console.log('replacing track', newTrack);
         if (this.videoSender != null) {
           this.videoSender.replaceTrack(newTrack);
         } else {
           this.videoSender = this.peerConnection.addTrack(newTrack);
         }
       }
     }
   };
 
   private gotIeCandidate = (event: RTCPeerConnectionIceEvent) => {
     if (event.candidate != null) {
       console.log('WowzaPeerConnectionPublish.gotIceCandidate: ' + JSON.stringify({ ice: event.candidate }));
     }
   };
 
   private gotDescription = async (description: RTCSessionDescriptionInit) => {
     console.log('WowzaPeerConnectionPublish.gotDescription: SDP:', description);
     //console.log(description.sdp+'');
 
     // TODO! improve mungeData Interface
     let mungeData: any = new Object();
 
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
       await this.peerConnection.setLocalDescription(description);
       console.error('sending data');
       this.wsConnection.send(JSON.stringify(wsConnectionMessage));
     } catch (error) {
       let newError = { message: 'Peer connection failed', ...error };
       this.errorHandler(newError);
     }
   };
   // TODO! onstats type should be (value: RTCStatsReport) => RTCStatsReport | PromiseLike<RTCStatsReport>'.
   private createOnStats = (onStats: any) => {
     return () => {
       if (this.peerConnection != null) {
         this.peerConnection.getStats(null).then(onStats, (err) => console.error(err));
       }
     };
   };
 
   private errorHandler(error: any) {
     console.trace();
     if (onerror != null) {
       onerror(error);
     }
   }
 }
 