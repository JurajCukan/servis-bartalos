import { app, BrowserWindow, ipcMain, dialog, session } from "electron";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import { initializeAutoUpdater } from "./updater.js";
import { autoUpdater } from "electron-updater";

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

function getInitialDataDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "pocketbase", "initial_pb_data")
    : path.join(app.getAppPath(), "pocketbase", "initial_pb_data");
}

function copyFolderRecursiveSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function seedDatabaseIfNeeded(dataDir: string) {
  try {
    const dbFile = path.join(dataDir, "data.db");
    if (!fs.existsSync(dbFile)) {
      const initialDataDir = getInitialDataDir();
      if (fs.existsSync(initialDataDir)) {
        console.log(`[main] Copying initial_pb_data seed from ${initialDataDir} to ${dataDir}...`);
        fs.mkdirSync(dataDir, { recursive: true });
        copyFolderRecursiveSync(initialDataDir, dataDir);
      }
    }
  } catch (err) {
    console.error("[main] Failed to seed database:", err);
  }
}

function startPocketBase() {
  const pocketbasePath = getPocketBasePath();
  const dataDir = getDataDir();

  seedDatabaseIfNeeded(dataDir);

  console.log(`[main] Spawning PocketBase from: ${pocketbasePath}`);
  console.log(`[main] Storing data in: ${dataDir}`);

  pbProcess = spawn(
    pocketbasePath,
    ["serve", "--http=127.0.0.1:8090", `--dir=${dataDir}`],
    { stdio: "ignore" },
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

function checkPocketBaseReady(callback: () => void, checkCollections = true) {
  const checkUrl = "http://127.0.0.1:8090/api/health";
  const interval = 100;
  const maxRetries = 100; // 10s max wait
  let retries = 0;

  const check = () => {
    http
      .get(checkUrl, (res) => {
        if (res.statusCode === 200) {
          console.log("[main] PocketBase is healthy and ready!");
          if (checkCollections) {
            verifyAndRepairCollections(callback);
          } else {
            callback();
          }
        } else {
          retry();
        }
      })
      .on("error", () => {
        retry();
      });
  };

  const retry = () => {
    retries++;
    if (retries > maxRetries) {
      console.error("[main] PocketBase health check timed out after 10 seconds.");
      dialog.showErrorBox(
        "Chyba spustenia databázy",
        "Aplikácia nemohla nadviazať spojenie s lokálnou databázou PocketBase (http://127.0.0.1:8090).\nSkontrolujte, či port 8090 neblokuje iný spustený program.",
      );
      callback();
    } else {
      setTimeout(check, interval);
    }
  };

  check();
}

function verifyAndRepairCollections(callback: () => void) {
  const checkCollUrl = "http://127.0.0.1:8090/api/collections/customers/records";
  http
    .get(checkCollUrl, (res) => {
      if (res.statusCode === 404) {
        console.warn("[main] Collection 'customers' returned 404 — data.db is unseeded. Auto-repairing...");
        stopPocketBase();
        const dataDir = getDataDir();
        try {
          fs.rmSync(dataDir, { recursive: true, force: true });
        } catch (e) {
          console.error("[main] Failed to clear dataDir:", e);
        }
        seedDatabaseIfNeeded(dataDir);
        startPocketBase();
        checkPocketBaseReady(callback, false);
      } else {
        console.log("[main] Database collections verified successfully.");
        callback();
      }
    })
    .on("error", (err) => {
      console.error("[main] Error checking collection health:", err);
      callback();
    });
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
    },
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
    mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
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
    checkPocketBaseReady(() => {
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
  autoUpdater.checkForUpdates().catch((err) => {
    console.error("[main] Failed to check for updates manually:", err);
  });
});

ipcMain.on("install-update", () => {
  console.log("[main] Installing update and quitting...");
  stopPocketBase();
  setTimeout(() => {
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
