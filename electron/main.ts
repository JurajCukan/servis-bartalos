import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicit mode detection
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
console.log(
  `[Electron Main] Spustenie aplikácie v režime: ${isDev ? "DEVELOPMENT" : "PRODUCTION"}`,
);

let serverProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

// Dynamicky zvolený port na základe režimu (8080 pre Vite dev server, 3000 pre produkčný Nitro server)
const PORT = isDev ? process.env.PORT || "8080" : process.env.PORT || "3000";
const HOST = "127.0.0.1";
const SERVER_URL = `http://${HOST}:${PORT}`;

// --- VYRIEŠENIE CIEST PRE DEV vs PRODUCTION ---

// Preload cesta (zostavený JS sa nachádza v rovnakom dist-electron priečinku)
const preloadPath = path.join(__dirname, "preload.js");
console.log(`[Electron Main] Preload cesta: ${preloadPath}`);

// Nitro server entrypoint cesta
// - V dev móde nepoužívame local server entry, načítame priamo Vite dev server na 127.0.0.1:8080
// - V prod móde, ak je aplikácia packaged (zabalená cez electron-builder), .output je v resources/app.asar.unpacked/
// - V prod móde pri spustení lokálne (nepackaged), .output je v koreni projektu (relatívne k dist-electron o úroveň vyššie)
const serverPath = isDev
  ? "N/A (Spustený Vite Dev Server)"
  : app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", ".output", "server", "index.mjs")
    : path.join(__dirname, "..", ".output", "server", "index.mjs");

console.log(`[Electron Main] Cesta k produkčnému serveru: ${serverPath}`);

function startProductionServer() {
  if (isDev) return;

  console.log(
    `[Electron Main] Spúšťam Nitro server pomocou vstavaného Node z cesty: ${serverPath}`,
  );

  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: PORT,
      HOST: HOST,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
    },
    stdio: "inherit",
  });

  serverProcess.on("error", (err) => {
    console.error("[Electron Main] Chyba pri spúšťaní Nitro servera:", err);
  });
}

function waitForServerAndCreate(url: string, callback: () => void, retries = 50) {
  console.log(
    `[Electron Main] Čakám na dostupnosť servera na adrese: ${url} (ostáva pokusov: ${retries})`,
  );
  http
    .get(url, (res) => {
      if (res.statusCode && res.statusCode < 500) {
        console.log(`[Electron Main] Server úspešne odpovedal (HTTP ${res.statusCode}).`);
        callback();
      } else {
        console.log(
          `[Electron Main] Server odpovedal so stavom ${res.statusCode}, skúšam znova o 100ms...`,
        );
        setTimeout(() => waitForServerAndCreate(url, callback, retries - 1), 100);
      }
    })
    .on("error", () => {
      if (retries > 0) {
        setTimeout(() => waitForServerAndCreate(url, callback, retries - 1), 100);
      } else {
        console.warn(
          "[Electron Main] Server neodpovedal v stanovenom limite. Otváram okno aj bez odpovede...",
        );
        callback();
      }
    });
}

function createWindow() {
  console.log(`[Electron Main] Vytváram okno a otváram URL: ${SERVER_URL}`);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Servisná knižka Bartalos",
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(SERVER_URL);

  // Otvorenie dev tools vo vývojovom prostredí
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    console.log("[Electron Main] Okno bolo zatvorené.");
    mainWindow = null;
  });
}

// Spustenie servera pred otvorením okna (iba pre prod)
if (!isDev) {
  startProductionServer();
}

app.whenReady().then(() => {
  if (isDev) {
    createWindow();
  } else {
    // V prod čakáme na inicializáciu servera
    waitForServerAndCreate(SERVER_URL, createWindow);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  console.log("[Electron Main] Všetky okná boli zatvorené.");
  if (serverProcess) {
    console.log("[Electron Main] Ukončujem Nitro server process...");
    serverProcess.kill("SIGTERM");
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});
