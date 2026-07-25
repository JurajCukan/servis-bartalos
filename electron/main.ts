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

function getMigrationsDir(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "pocketbase", "pb_migrations")
    : path.join(app.getAppPath(), "pocketbase", "pb_migrations");
}

function copyMigrationsIfNeeded(dataDir: string) {
  try {
    const srcMigrations = getMigrationsDir();
    const destMigrations = path.join(dataDir, "pb_migrations");

    if (fs.existsSync(srcMigrations)) {
      fs.mkdirSync(destMigrations, { recursive: true });
      const files = fs.readdirSync(srcMigrations);
      for (const file of files) {
        const srcFile = path.join(srcMigrations, file);
        const destFile = path.join(destMigrations, file);
        if (!fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`[main] Copied migration file ${file} to ${destMigrations}`);
        }
      }
    }
  } catch (err) {
    console.error("[main] Failed to copy pb_migrations:", err);
  }
}

function startPocketBase() {
  const pocketbasePath = getPocketBasePath();
  const dataDir = getDataDir();

  copyMigrationsIfNeeded(dataDir);

  console.log(`[main] Spawning PocketBase from: ${pocketbasePath}`);
  console.log(`[main] Storing data in: ${dataDir}`);

  pbProcess = spawn(
    pocketbasePath,
    ["serve", "--http=127.0.0.1:8090", `--dir=${dataDir}`, "--automigrate"],
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
