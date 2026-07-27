import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ─── Database IPC ────────────────────────────────────────────────────────
  db: {
    searchCustomers: (query: string) => ipcRenderer.invoke("db:search-customers", query),
    createCustomer: (data: any) => ipcRenderer.invoke("db:create-customer", data),
    updateCustomer: (id: string, data: any) => ipcRenderer.invoke("db:update-customer", id, data),
    getVehiclesWithCustomers: () => ipcRenderer.invoke("db:get-vehicles-with-customers"),
    getVehicleDetail: (vehicleId: string) => ipcRenderer.invoke("db:get-vehicle-detail", vehicleId),
    checkDuplicatePlate: (plate: string, excludeId?: string) => ipcRenderer.invoke("db:check-duplicate-plate", plate, excludeId),
    createVehicle: (data: any, photoBase64?: string, photoName?: string) => ipcRenderer.invoke("db:create-vehicle", data, photoBase64, photoName),
    updateVehicle: (vehicleId: string, data: any, photoBase64?: string, photoName?: string, removePhoto?: boolean) => ipcRenderer.invoke("db:update-vehicle", vehicleId, data, photoBase64, photoName, removePhoto),
    deleteVehicle: (vehicleId: string) => ipcRenderer.invoke("db:delete-vehicle", vehicleId),
    getServiceRecords: (vehicleId: string) => ipcRenderer.invoke("db:get-service-records", vehicleId),
    getAllServiceRecords: () => ipcRenderer.invoke("db:get-all-service-records"),
    createServiceRecord: (data: any, photosData?: any[]) => ipcRenderer.invoke("db:create-service-record", data, photosData),
    updateServiceRecord: (recordId: string, data: any, newPhotosData?: any[], removedPhotos?: string[]) => ipcRenderer.invoke("db:update-service-record", recordId, data, newPhotosData, removedPhotos),
    deleteServiceRecord: (recordId: string) => ipcRenderer.invoke("db:delete-service-record", recordId),
    getScheduledTasks: (vehicleId: string) => ipcRenderer.invoke("db:get-scheduled-tasks", vehicleId),
    getAllActiveTasks: () => ipcRenderer.invoke("db:get-all-active-tasks"),
    createScheduledTask: (data: any) => ipcRenderer.invoke("db:create-scheduled-task", data),
    updateTaskStatus: (id: string, status: string) => ipcRenderer.invoke("db:update-task-status", id, status),
    exportAllData: () => ipcRenderer.invoke("db:export-all-data"),
    importData: (bundle: any) => ipcRenderer.invoke("db:import-data", bundle),
  },

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
