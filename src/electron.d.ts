export interface IElectronAPI {
  db: {
    searchCustomers: (query: string) => Promise<any[]>;
    createCustomer: (data: any) => Promise<any>;
    updateCustomer: (id: string, data: any) => Promise<boolean>;
    getVehiclesWithCustomers: () => Promise<any[]>;
    getVehicleDetail: (vehicleId: string) => Promise<any | null>;
    checkDuplicatePlate: (plate: string, excludeId?: string) => Promise<{id: string} | null>;
    createVehicle: (data: any, photoBase64?: string, photoName?: string) => Promise<string>;
    updateVehicle: (vehicleId: string, data: any, photoBase64?: string, photoName?: string, removePhoto?: boolean) => Promise<boolean>;
    deleteVehicle: (vehicleId: string) => Promise<boolean>;
    getServiceRecords: (vehicleId: string) => Promise<any[]>;
    getAllServiceRecords: () => Promise<any[]>;
    createServiceRecord: (data: any, photosData?: any[]) => Promise<string>;
    updateServiceRecord: (recordId: string, data: any, newPhotosData?: any[], removedPhotos?: string[]) => Promise<boolean>;
    deleteServiceRecord: (recordId: string) => Promise<boolean>;
    getScheduledTasks: (vehicleId: string) => Promise<any[]>;
    getAllActiveTasks: () => Promise<any[]>;
    createScheduledTask: (data: any) => Promise<string>;
    updateTaskStatus: (id: string, status: string) => Promise<boolean>;
    exportAllData: () => Promise<any>;
    importData: (bundle: any) => Promise<boolean>;
  };

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
