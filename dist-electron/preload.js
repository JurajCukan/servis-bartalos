import { contextBridge } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {});
//#endregion
export {};
