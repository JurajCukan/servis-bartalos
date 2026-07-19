import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
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
});
