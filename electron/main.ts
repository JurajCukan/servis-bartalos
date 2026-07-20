import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import { initializeAutoUpdater } from "./updater.js";

let pbProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function getPocketBasePath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "pocketbase", "pocketbase.exe")
    : path.join(app.getAppPath(), "pocketbase", "pocketbase.exe");
}

function getDataDir(): string {
  return path.join(app.getPath("userData"), "pocketbase_data");
}

function getSchemaPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "pocketbase", "pb_schema.json")
    : path.join(app.getAppPath(), "pocketbase", "pb_schema.json");
}

function startPocketBase() {
  const pocketbasePath = getPocketBasePath();
  const dataDir = getDataDir();

  console.log(`[main] Spawning PocketBase from: ${pocketbasePath}`);
  console.log(`[main] Storing data in: ${dataDir}`);

  pbProcess = spawn(
    pocketbasePath,
    ["serve", "--http=127.0.0.1:8090", `--dir=${dataDir}`, "--automigrate"],
    { stdio: "ignore" }
  );

  pbProcess.on("error", (err) => {
    console.error("[main] Failed to start PocketBase process:", err);
  });

  pbProcess.on("exit", (code) => {
    console.log(`[main] PocketBase process exited with code ${code}`);
  });
}

function stopPocketBase() {
  if (pbProcess) {
    console.log("[main] Terminating PocketBase child process...");
    pbProcess.kill();
    pbProcess = null;
  }
}

function checkPocketBaseReady(callback: () => void) {
  const checkUrl = "http://127.0.0.1:8090/api/health";
  const interval = 100;

  const check = () => {
    http
      .get(checkUrl, (res) => {
        if (res.statusCode === 200) {
          console.log("[main] PocketBase is healthy and ready!");
          callback();
        } else {
          console.log(`[main] PocketBase returned status ${res.statusCode}, retrying...`);
          setTimeout(check, interval);
        }
      })
      .on("error", () => {
        console.log("[main] PocketBase not ready yet, retrying...");
        setTimeout(check, interval);
      });
  };

  check();
}

/**
 * Import pb_schema.json into PocketBase on first run.
 * Uses the PocketBase collections import API endpoint.
 */
async function importSchemaIfNeeded(): Promise<void> {
  const dataDir = getDataDir();
  const markerFile = path.join(dataDir, ".schema_imported");

  // Skip if schema was already imported
  if (fs.existsSync(markerFile)) {
    console.log("[main] Schema already imported, skipping.");
    return;
  }

  const schemaPath = getSchemaPath();
  if (!fs.existsSync(schemaPath)) {
    console.error("[main] pb_schema.json not found at:", schemaPath);
    return;
  }

  console.log("[main] First run detected — importing schema...");

  try {
    const schemaData = fs.readFileSync(schemaPath, "utf-8");
    const collections = JSON.parse(schemaData);

    const postData = JSON.stringify({ collections, deleteMissing: false });

    await new Promise<void>((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: 8090,
          path: "/api/collections/import",
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            if (res.statusCode === 200 || res.statusCode === 204) {
              console.log("[main] Schema imported successfully.");
              // Ensure data directory exists and write marker
              fs.mkdirSync(dataDir, { recursive: true });
              fs.writeFileSync(markerFile, new Date().toISOString(), "utf-8");
              resolve();
            } else {
              console.error(`[main] Schema import failed (${res.statusCode}):`, body);
              // Still resolve — don't block app start over a schema issue
              resolve();
            }
          });
        }
      );
      req.on("error", (err) => {
        console.error("[main] Schema import request error:", err);
        resolve(); // Don't block app start
      });
      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.error("[main] Error during schema import:", err);
  }
}

/**
 * In production mode, block requests to the PocketBase admin UI (/_/ paths).
 * Dev mode keeps admin accessible for debugging.
 */
function blockAdminUIInProduction() {
  if (isDev) {
    console.log("[main] Dev mode — PocketBase admin UI accessible at http://127.0.0.1:8090/_/");
    return;
  }

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["http://127.0.0.1:8090/_/*"] },
    (details, callback) => {
      console.log(`[main] Blocked admin UI request: ${details.url}`);
      callback({ cancel: true });
    }
  );
  console.log("[main] Production mode — PocketBase admin UI blocked.");
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

  // Remove the standard window menu bar
  mainWindow.removeMenu();

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Setup auto-updater once window is ready
  initializeAutoUpdater(mainWindow);
}

// Ensure single instance lock
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

  app.whenReady().then(async () => {
    blockAdminUIInProduction();
    startPocketBase();
    checkPocketBaseReady(async () => {
      await importSchemaIfNeeded();
      createWindow();
    });
  });
}

// Kill PocketBase when app quits
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  stopPocketBase();
});

// ─── IPC: Updates ────────────────────────────────────────────────────────────

ipcMain.on("check-for-updates", () => {
  console.log("[main] Manual check for updates requested.");
});

ipcMain.on("install-update", () => {
  console.log("[main] Installing update and quitting...");
  stopPocketBase();
  setTimeout(() => {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.quitAndInstall();
  }, 500);
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// ─── IPC: File dialogs for Export/Import ─────────────────────────────────────

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
