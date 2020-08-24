declare module '*.json';

interface Window {
  adapter: any;
  webkitAudioContext: any | undefined;
}

interface Navigator {
  getDisplayMedia: any;
}

declare var module: NodeModule;
interface NodeModule {
  id: string;
}
