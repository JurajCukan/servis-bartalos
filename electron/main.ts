import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { exec } from "child_process";

const logFile = path.join(app.getPath("userData"), "debug_startup.log");

process.on("uncaughtException", (err) => {
  try { fs.appendFileSync(logFile, `[UNCAUGHT] ${err?.stack || err}\n`); } catch (_) {}
  dialog.showErrorBox("Chyba aplikácie", `Aplikácia spadla pri spúšťaní:\n${err?.message || err}`);
  app.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  try { fs.appendFileSync(logFile, `[REJECTION] ${reason?.stack || reason}\n`); } catch (_) {}
  dialog.showErrorBox("Chyba aplikácie", `Neočakávaná chyba:\n${reason?.message || reason}`);
  app.exit(1);
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true
    }
  }
]);

import { initializeAutoUpdater } from "./updater.js";
import { autoUpdater } from "electron-updater";
import {
  initDatabase, closeDatabase,
  searchCustomers, createCustomer, updateCustomer,
  getVehiclesWithCustomers, getVehicleDetail, checkDuplicatePlate,
  createVehicle, updateVehicle, deleteVehicleCascade,
  getServiceRecords, getAllServiceRecords, getServiceRecordById,
  createServiceRecord, updateServiceRecord, deleteServiceRecord,
  getScheduledTasks, getAllActiveTasks, createScheduledTask, updateTaskStatus,
  exportAllData, importData,
} from "./database.js";
import {
  initPhotos, savePhoto, deletePhoto, deleteAllPhotosForRecord,
  getPhotoPath, readPhotoAsBase64, getPhotosDir,
} from "./photos.js";

let mainWindow: BrowserWindow | null = null;
const isDev = false;

function getUserDataDir(): string {
  return app.getPath("userData");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    title: "Servisná knižka Bartalos",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadURL("app://-/index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  initializeAutoUpdater(mainWindow);
}

// ─── Custom Protocol for Photos ───────────────────────────────────────────────

function registerPhotoProtocol() {
  protocol.registerBufferProtocol("app-photo", (request, callback) => {
    const relativePath = decodeURIComponent(request.url.slice("app-photo://".length));
    const fullPath = path.join(getPhotosDir(), relativePath);
    
    fs.readFile(fullPath, (error, data) => {
      if (error) {
        console.error(`[protocol] Failed to load photo: ${fullPath}`, error);
        callback({ error: -6 /* net::ERR_FILE_NOT_FOUND */ });
      } else {
        let mimeType = "image/jpeg";
        if (fullPath.toLowerCase().endsWith(".png")) mimeType = "image/png";
        else if (fullPath.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
        
        callback({ mimeType, data });
      }
    });
  });
  console.log("[main] Registered app-photo:// protocol handler.");
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Setup local app:// protocol to serve Vite bundle without CORS issues
    protocol.registerBufferProtocol("app", (request, callback) => {
      const url = new URL(request.url);
      const relativePath = decodeURIComponent(url.pathname.substring(1)); // remove leading slash
      const fullPath = path.join(app.getAppPath(), "dist", relativePath);
      
      fs.readFile(fullPath, (error, data) => {
        if (error) {
          console.error(`[protocol] Failed to load: ${fullPath}`, error);
          callback({ error: -6 /* net::ERR_FILE_NOT_FOUND */ });
        } else {
          let mimeType = "text/plain";
          if (fullPath.endsWith(".html")) mimeType = "text/html";
          else if (fullPath.endsWith(".js")) mimeType = "application/javascript";
          else if (fullPath.endsWith(".css")) mimeType = "text/css";
          else if (fullPath.endsWith(".png")) mimeType = "image/png";
          else if (fullPath.endsWith(".svg")) mimeType = "image/svg+xml";
          else if (fullPath.endsWith(".json")) mimeType = "application/json";

          callback({ mimeType, data });
        }
      });
    });

    const userDataDir = getUserDataDir();
    
    // Log startup only after acquiring the lock
    try {
      fs.mkdirSync(userDataDir, { recursive: true });
      fs.appendFileSync(logFile, `\n=== STARTUP ${new Date().toISOString()} ===\n`);
      fs.appendFileSync(logFile, `app.getPath("userData") = ${userDataDir}\n`);
    } catch (e: any) {
      // ignore
    }

    // Kill leftover PocketBase processes from v1.0.0 silently
    if (process.platform === "win32") {
      exec("taskkill /f /im pocketbase.exe", () => {
        // Ignore errors if it wasn't running
      });
    }

    console.log(`[main] User data directory: ${userDataDir}`);

    // Initialize database and photos with error handling
    try {
      initDatabase(userDataDir);
    } catch (err: any) {
      const msg = `Nepodarilo sa inicializovať databázu:\n${err?.message || err}`;
      try { fs.appendFileSync(logFile, `[DB_INIT_ERROR] ${err?.stack || err}\n`); } catch (_) {}
      dialog.showErrorBox("Chyba databázy", msg);
      app.exit(1);
      return;
    }

    initPhotos(userDataDir);
    registerPhotoProtocol();

    createWindow();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  closeDatabase();
});

// ─── IPC: Database — Customers ────────────────────────────────────────────────

ipcMain.handle("db:search-customers", (_event, query: string) => {
  return searchCustomers(query);
});

ipcMain.handle("db:create-customer", (_event, data) => {
  return createCustomer(data);
});

ipcMain.handle("db:update-customer", (_event, id: string, data) => {
  updateCustomer(id, data);
  return true;
});

// ─── IPC: Database — Vehicles ─────────────────────────────────────────────────

ipcMain.handle("db:get-vehicles-with-customers", () => {
  const vehicles = getVehiclesWithCustomers();
  return vehicles.map((v) => ({
    ...v,
    photo_url: v.photo ? `app-photo://vehicles/${v.photo}` : null,
  }));
});

ipcMain.handle("db:get-vehicle-detail", (_event, vehicleId: string) => {
  const detail = getVehicleDetail(vehicleId);
  if (!detail) return null;
  return {
    ...detail,
    photo_url: detail.photo ? `app-photo://vehicles/${detail.photo}` : null,
  };
});

ipcMain.handle("db:check-duplicate-plate", (_event, plate: string, excludeId?: string) => {
  return checkDuplicatePlate(plate, excludeId) ?? null;
});

ipcMain.handle(
  "db:create-vehicle",
  (_event, data: Record<string, unknown>, photoBase64?: string, photoName?: string) => {
    let photoFilename: string | null = null;
    const vehicleId = createVehicle({ ...data, photo: null } as Parameters<typeof createVehicle>[0]);

    if (photoBase64 && photoName) {
      photoFilename = savePhoto("vehicles", vehicleId, photoName, photoBase64);
      updateVehicle(vehicleId, { photo: photoFilename });
    }

    return vehicleId;
  }
);

ipcMain.handle(
  "db:update-vehicle",
  (
    _event,
    vehicleId: string,
    data: Record<string, unknown>,
    photoBase64?: string | null,
    photoName?: string | null,
    removePhoto?: boolean
  ) => {
    // Handle photo changes
    if (removePhoto) {
      const existing = getVehicleDetail(vehicleId);
      if (existing?.photo) {
        deletePhoto("vehicles", existing.photo);
      }
      data.photo = null;
    } else if (photoBase64 && photoName) {
      // Delete old photo first
      const existing = getVehicleDetail(vehicleId);
      if (existing?.photo) {
        deletePhoto("vehicles", existing.photo);
      }
      const newFilename = savePhoto("vehicles", vehicleId, photoName, photoBase64);
      data.photo = newFilename;
    }

    updateVehicle(vehicleId, data);
    return true;
  }
);

ipcMain.handle("db:delete-vehicle", (_event, vehicleId: string) => {
  // Get all service records to delete their photos
  const records = getServiceRecords(vehicleId);
  for (const r of records) {
    for (const photo of r.photos) {
      deletePhoto("service_records", photo);
    }
  }
  // Delete vehicle photo
  const vehicle = getVehicleDetail(vehicleId);
  if (vehicle?.photo) {
    deletePhoto("vehicles", vehicle.photo);
  }
  deleteVehicleCascade(vehicleId);
  return true;
});

// ─── IPC: Database — Service Records ──────────────────────────────────────────

ipcMain.handle("db:get-service-records", (_event, vehicleId: string) => {
  const records = getServiceRecords(vehicleId);
  return records.map((r) => ({
    ...r,
    photo_urls: r.photos.map((p: string) => `app-photo://service_records/${p}`),
  }));
});

ipcMain.handle("db:get-all-service-records", () => {
  const records = getAllServiceRecords();
  return records.map((r) => ({
    ...r,
    photo_urls: r.photos.map((p: string) => `app-photo://service_records/${p}`),
  }));
});

ipcMain.handle(
  "db:create-service-record",
  (
    _event,
    data: Record<string, unknown>,
    photosData?: Array<{ name: string; base64: string }>
  ) => {
    const recordId = createServiceRecord(data as Parameters<typeof createServiceRecord>[0]);

    if (photosData && photosData.length > 0) {
      const savedNames: string[] = [];
      for (const p of photosData) {
        const name = savePhoto("service_records", recordId, p.name, p.base64);
        savedNames.push(name);
      }
      updateServiceRecord(recordId, { photos: savedNames });
    }

    return recordId;
  }
);

ipcMain.handle(
  "db:update-service-record",
  (
    _event,
    recordId: string,
    data: Record<string, unknown>,
    newPhotosData?: Array<{ name: string; base64: string }>,
    removedPhotos?: string[]
  ) => {
    // Get current photos
    const existing = getServiceRecordById(recordId);
    let currentPhotos = existing?.photos ?? [];

    // Remove specified photos
    if (removedPhotos && removedPhotos.length > 0) {
      for (const filename of removedPhotos) {
        deletePhoto("service_records", filename);
      }
      currentPhotos = currentPhotos.filter((p: string) => !removedPhotos.includes(p));
    }

    // Add new photos
    if (newPhotosData && newPhotosData.length > 0) {
      for (const p of newPhotosData) {
        const name = savePhoto("service_records", recordId, p.name, p.base64);
        currentPhotos.push(name);
      }
    }

    // Update photos list in data
    data.photos = currentPhotos;
    updateServiceRecord(recordId, data);
    return true;
  }
);

ipcMain.handle("db:delete-service-record", (_event, recordId: string) => {
  const existing = getServiceRecordById(recordId);
  if (existing) {
    for (const photo of existing.photos) {
      deletePhoto("service_records", photo);
    }
  }
  deleteServiceRecord(recordId);
  return true;
});

// ─── IPC: Database — Scheduled Tasks ──────────────────────────────────────────

ipcMain.handle("db:get-scheduled-tasks", (_event, vehicleId: string) => {
  return getScheduledTasks(vehicleId);
});

ipcMain.handle("db:get-all-active-tasks", () => {
  return getAllActiveTasks();
});

ipcMain.handle("db:create-scheduled-task", (_event, data) => {
  return createScheduledTask(data);
});

ipcMain.handle("db:update-task-status", (_event, id: string, status: string) => {
  updateTaskStatus(id, status);
  return true;
});

// ─── IPC: Database — Export / Import ──────────────────────────────────────────

ipcMain.handle("db:export-all-data", () => {
  const data = exportAllData();
  // Include photo base64 data for export
  const vehiclesWithPhotos = (data.vehicles as Array<Record<string, unknown>>).map((v) => {
    const photoData = v.photo ? readPhotoAsBase64("vehicles", v.photo as string) : null;
    return { ...v, photo_base64: photoData };
  });
  const recordsWithPhotos = data.service_records.map((sr) => {
    const photosBase64: Record<string, string> = {};
    for (const filename of sr.photos) {
      const b64 = readPhotoAsBase64("service_records", filename);
      if (b64) photosBase64[filename] = b64;
    }
    return { ...sr, photos_base64: photosBase64 };
  });
  return {
    ...data,
    vehicles: vehiclesWithPhotos,
    service_records: recordsWithPhotos,
  };
});

ipcMain.handle("db:import-data", (_event, bundle) => {
  const idMap = importData(bundle);

  // Restore vehicle photos
  if (bundle.vehicles) {
    for (const v of bundle.vehicles) {
      if (v.photo_base64 && v.photo) {
        const newVehicleId = idMap[v.id as string] || (v.id as string);
        const savedName = savePhoto("vehicles", newVehicleId, v.photo as string, v.photo_base64 as string);
        updateVehicle(newVehicleId, { photo: savedName });
      }
    }
  }

  // Restore service record photos
  if (bundle.service_records) {
    for (const sr of bundle.service_records) {
      if (sr.photos_base64) {
        const newRecordId = idMap[sr.id as string] || (sr.id as string);
        const restoredPhotos: string[] = [];
        for (const [origName, b64] of Object.entries(sr.photos_base64 as Record<string, string>)) {
          const savedName = savePhoto("service_records", newRecordId, origName, b64);
          restoredPhotos.push(savedName);
        }
        updateServiceRecord(newRecordId, { photos: restoredPhotos });
      }
    }
  }

  return true;
});

// ─── IPC: PDF Export ──────────────────────────────────────────────────────────

ipcMain.handle("export-vehicle-pdf", async (event, vehicleId: string) => {
  return new Promise(async (resolve) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: "Uložiť servisnú knižku ako PDF",
        defaultPath: `servisna-knizka-${vehicleId}.pdf`,
        filters: [{ name: "PDF dokumenty", extensions: ["pdf"] }],
      });

      if (canceled || !filePath) {
        return resolve({ success: false, error: "Ukladanie bolo zrušené." });
      }

      const printWindow = new BrowserWindow({
        show: false,
        width: 1240,
        height: 1754,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const url = isDev 
        ? `http://localhost:5173/#/export/${vehicleId}`
        : `app://./index.html#/export/${vehicleId}`;

      const onReady = async (e: Electron.IpcMainEvent) => {
        if (e.sender.id !== printWindow.webContents.id) return;
        
        try {
          const pdfBuffer = await printWindow.webContents.printToPDF({
            pageSize: "A4",
            printBackground: true,
          });

          fs.writeFileSync(filePath, pdfBuffer);
          resolve({ success: true, filePath });
        } catch (error: any) {
          console.error("Chyba pri generovaní PDF:", error);
          resolve({ success: false, error: "Nepodarilo sa vygenerovať PDF." });
        } finally {
          ipcMain.removeListener("notify-pdf-ready", onReady);
          if (!printWindow.isDestroyed()) printWindow.destroy();
        }
      };

      ipcMain.on("notify-pdf-ready", onReady);
      printWindow.loadURL(url);

      setTimeout(() => {
        if (!printWindow.isDestroyed()) {
          ipcMain.removeListener("notify-pdf-ready", onReady);
          printWindow.destroy();
          resolve({ success: false, error: "Časový limit pre vygenerovanie PDF vypršal." });
        }
      }, 15000);

    } catch (error: any) {
      console.error("Chyba pri PDF exporte:", error);
      resolve({ success: false, error: "Vyskytla sa neočakávaná chyba." });
    }
  });
});

// ─── IPC: Updates ─────────────────────────────────────────────────────────────

ipcMain.on("check-for-updates", () => {
  console.log("[main] Manual check for updates requested.");
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("[main] Failed to check for updates manually:", err);
  });
});

ipcMain.on("download-update", () => {
  console.log("[main] Manual download for update requested.");
  autoUpdater.downloadUpdate();
});

ipcMain.on("install-update", () => {
  console.log("[main] Installing update and quitting...");
  closeDatabase();
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 500);
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// ─── IPC: File dialogs for Export/Import ──────────────────────────────────────

ipcMain.handle("show-save-dialog", async (_event, options: Electron.SaveDialogOptions) => {
  if (!mainWindow) return { canceled: true, filePath: undefined };
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle("show-open-dialog", async (_event, options: Electron.OpenDialogOptions) => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle("write-file", async (_event, filePath: string, data: string, encoding?: string) => {
  fs.writeFileSync(filePath, Buffer.from(data, (encoding as BufferEncoding) || "base64"));
  return true;
});

ipcMain.handle("read-file", async (_event, filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
});
