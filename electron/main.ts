import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import { fileURLToPath } from "url";
import { initializeAutoUpdater } from "./updater.js";

// Workaround for __dirname in ESM if type is module, but since we are compiling to CommonJS in tsconfig.electron.json,
// standard CommonJS __dirname and require are available and correct!
// However, since tsconfig.electron.json module is commonjs, __dirname is safe.

let pbProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function startPocketBase() {
  const pocketbasePath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "pocketbase", "pocketbase.exe")
    : path.join(app.getAppPath(), "pocketbase", "pocketbase.exe");

  const dataDir = path.join(app.getPath("userData"), "pocketbase_data");

  console.log(`[main] Spawning PocketBase from: ${pocketbasePath}`);
  console.log(`[main] Storing data in: ${dataDir}`);

  pbProcess = spawn(
    pocketbasePath,
    ["serve", "--http=127.0.0.1:8090", `--dir=${dataDir}`],
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

  app.whenReady().then(() => {
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

// IPC communication handlers for updates
ipcMain.on("check-for-updates", () => {
  console.log("[main] Manual check for updates requested.");
});

ipcMain.on("install-update", () => {
  console.log("[main] Installing update and quitting...");
  stopPocketBase();
  // Wait a split second to let pocketbase clean up
  setTimeout(() => {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.quitAndInstall();
  }, 500);
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
