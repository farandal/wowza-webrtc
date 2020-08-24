# wowza-webrtc

## Requirements

 - yarn ^1.22.4: curl --compressed -o- -L https://yarnpkg.com/install.sh | bash

## Installation

  - Add wowza package to your package.json
  - "wowza": "git+ssh://git@github.com:farandal/wowza-webrtc.git"
  - TODO: list this package in npm registry

## Usage 

  ```javascript

    import WowzaWebRTCPublish, { IState } from '@wowza/WowzaWebRTCPublish';
    import Settings from '@wowza/Settings';
    
    //this.wowzaWebRTCPublish = new WowzaWebRTCPublish(IState,ICallbacks)
    this.wowzaWebRTCPublish = new WowzaWebRTCPublish(
      {
        videoElementPublish: this.videoElement.nativeElement as HTMLVideoElement,
        useSoundMeter: true,
      },
      {
        onStateChanged: (newState: IState) => {
          console.log('WowzaWebRTCPublish.onStateChanged');

          // Update the cameras the cameras
          this.form.cameras = newState.cameras;
          // Update the microphones
          this.form.microphones = newState.microphones;

          if (newState.connectionState === 'connected') {
            this.onPublishPeerConnected();
          } else if (newState.connectionState === 'failed') {
            this.onPublishPeerConnectionFailed();
          }
        },
        onCameraChanged: (cameraId: string) => {
          console.log('camera has changed, ', cameraId);
        },
        onMicrophoneChanged: (microphoneId: string) => {
          console.log('mic has changed, ', microphoneId);
        },
        onError: this.errorHandler,
        onSoundMeter: this.onSoundMeter,
      }
    );

    onPublishPeerConnected = () => {
      console.info('onPublishPeerConnected');
    };

    onPublishPeerConnectionFailed = () => {
      console.error('Peer connection failed');
    };

    onPublishPeerConnectionStopped = () => {
      console.info('Stopped');
    };

    onSoundMeter = (level: number):number => {
      let shiftLevel = level - 1;
      let levelCirc = Math.round(100 * Math.sqrt(1 - shiftLevel * shiftLevel));
      return levelCirc;
    };

    errorHandler = (error: any) => {
      console.error(error.message)
      this.wowzaWebRTCPublish.stop();
    };

    
  ```

  ## Class Instance Methods

  ```javascript

  this.wowzaWebRTCPublish.setCamera(cameraId:string);
  this.wowzaWebRTCPublish.setMicrophone(micId:string);
  this.wowzaWebRTCPublish.setVideoEnabled(status:boolean);
  this.wowzaWebRTCPublish.setAudioEnabled(status:boolean);
  this.wowzaWebRTCPublish.updateFrameSize(framesize:string);
  this.wowzaWebRTCPublish.set(settings:IState);

  // Cookie helper
  Settings.saveToCookie(settings:IState);
  Settings.mapFromCookie():IState
 
 ```

