export interface IElectronAPI {
  // Updates
  checkForUpdates: () => void;
  installUpdate: () => void;
  getAppVersion: () => Promise<string>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (
    callback: (info: { version: string; releaseNotes?: string }) => void,
  ) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onDownloadProgress: (
    callback: (progress: { percent: number; bytesPerSecond: number }) => void,
  ) => () => void;
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void;
  onUpdateError: (callback: (err: { message: string }) => void) => () => void;

  // File dialogs for Export/Import
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePath?: string }>;

  showOpenDialog: (options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;

  writeFile: (filePath: string, data: string, encoding?: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
