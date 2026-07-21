import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";

export function initializeAutoUpdater(mainWindow: BrowserWindow) {
  // Disable automatic update download if needed, but the prompt says Auto-download: true
  autoUpdater.autoDownload = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[Updater] Update available:", info.version);
    mainWindow.webContents.send("update-available");
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[Updater] Update not available.");
  });

  autoUpdater.on("error", (err) => {
    console.error("[Updater] Error in auto-updater:", err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log(
      `[Updater] Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`,
    );
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[Updater] Update downloaded:", info.version);
    mainWindow.webContents.send("update-downloaded");
  });

  // Check GitHub Releases on startup (after 3 second delay)
  setTimeout(() => {
    console.log("[Updater] Running startup update check...");
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("[Updater] Failed to check for updates on startup:", err);
    });
  }, 3000);
}
