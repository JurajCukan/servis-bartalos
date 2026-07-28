import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";

export function initializeAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = false;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for update...");
    mainWindow.webContents.send("update-checking");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] Update available:", info.version);
    mainWindow.webContents.send("update-available", {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[Updater] Update not available.");
    mainWindow.webContents.send("update-not-available");
  });

  autoUpdater.on("error", (err) => {
    console.error("[Updater] Error in auto-updater:", err);
    mainWindow.webContents.send("update-error", {
      message: (err as Error).message || "Chyba pri kontrole aktualizácií",
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log(
      `[Updater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`,
    );
    mainWindow.webContents.send("download-progress", {
      percent: Math.round(progressObj.percent),
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[Updater] Update downloaded:", info.version);
    mainWindow.webContents.send("update-downloaded", {
      version: info.version,
    });
  });

  // Check GitHub Releases on startup (after 3 second delay)
  setTimeout(() => {
    console.log("[Updater] Running startup update check...");
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("[Updater] Failed to check for updates on startup:", err);
    });
  }, 3000);
}
