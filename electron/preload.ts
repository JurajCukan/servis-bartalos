import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ─── Updates ───────────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  installUpdate: () => ipcRenderer.send("install-update"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  onUpdateAvailable: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on("update-available", subscription);
    return () => ipcRenderer.removeListener("update-available", subscription);
  },
  onUpdateDownloaded: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on("update-downloaded", subscription);
    return () => ipcRenderer.removeListener("update-downloaded", subscription);
  },

  // ─── File dialogs for Export/Import ────────────────────────────────────────
  showSaveDialog: (options: { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke("show-save-dialog", options),

  showOpenDialog: (options: { title?: string; filters?: Array<{ name: string; extensions: string[] }>; properties?: string[] }) =>
    ipcRenderer.invoke("show-open-dialog", options),

  writeFile: (filePath: string, data: string, encoding?: string) =>
    ipcRenderer.invoke("write-file", filePath, data, encoding),

  readFile: (filePath: string) =>
    ipcRenderer.invoke("read-file", filePath) as Promise<string>,
});
