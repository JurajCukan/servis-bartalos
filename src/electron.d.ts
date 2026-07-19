export interface IElectronAPI {
  checkForUpdates: () => void;
  installUpdate: () => void;
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (callback: () => void) => () => void;
  onUpdateDownloaded: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
