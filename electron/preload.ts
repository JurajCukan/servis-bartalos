import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ─── Updates ───────────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  installUpdate: () => ipcRenderer.send("install-update"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version") as Promise<string>,

  onUpdateChecking: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on("update-checking", sub);
    return () => ipcRenderer.removeListener("update-checking", sub);
  },
  onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => {
    const sub = (_: unknown, info: { version: string; releaseNotes?: string }) => callback(info);
    ipcRenderer.on("update-available", sub);
    return () => ipcRenderer.removeListener("update-available", sub);
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on("update-not-available", sub);
    return () => ipcRenderer.removeListener("update-not-available", sub);
  },
  onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number }) => void) => {
    const sub = (_: unknown, p: { percent: number; bytesPerSecond: number }) => callback(p);
    ipcRenderer.on("download-progress", sub);
    return () => ipcRenderer.removeListener("download-progress", sub);
  },
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    const sub = (_: unknown, info: { version: string }) => callback(info);
    ipcRenderer.on("update-downloaded", sub);
    return () => ipcRenderer.removeListener("update-downloaded", sub);
  },
  onUpdateError: (callback: (err: { message: string }) => void) => {
    const sub = (_: unknown, err: { message: string }) => callback(err);
    ipcRenderer.on("update-error", sub);
    return () => ipcRenderer.removeListener("update-error", sub);
  },

  // ─── File dialogs for Export/Import ────────────────────────────────────────
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => ipcRenderer.invoke("show-save-dialog", options),

  showOpenDialog: (options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => ipcRenderer.invoke("show-open-dialog", options),

  writeFile: (filePath: string, data: string, encoding?: string) =>
    ipcRenderer.invoke("write-file", filePath, data, encoding),

  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath) as Promise<string>,
});
