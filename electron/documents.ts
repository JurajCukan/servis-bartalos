import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import { app, shell } from "electron";

export async function generateDocumentPdf(input: {
  route: string;
  filename: string;
  appUrl: string;
}) {
  const targetWindow = new BrowserWindow({
    show: false,
    width: 1240,
    height: 1754,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await targetWindow.loadURL(`${input.appUrl}${input.route}`);

    // Wait for the renderer to dispatch the "document-ready" event
    await targetWindow.webContents.executeJavaScript(`
      new Promise((resolve) => {
        const handler = () => {
          window.removeEventListener("document-ready", handler);
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(resolve).catch(resolve);
          } else {
            resolve(true);
          }
        };
        window.addEventListener("document-ready", handler);
        
        // Fallback timeout in case event is never fired
        setTimeout(() => {
          window.removeEventListener("document-ready", handler);
          resolve(false);
        }, 10000);
      })
    `);

    const { filePath, canceled } = await dialog.showSaveDialog({
      title: "Uložiť dokument ako PDF",
      defaultPath: path.join(app.getPath("documents"), `${input.filename}.pdf`),
      filters: [{ name: "PDF dokument", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    const pdf = await targetWindow.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await fs.promises.writeFile(filePath, pdf);

    return {
      canceled: false,
      filePath,
    };
  } finally {
    if (!targetWindow.isDestroyed()) {
      targetWindow.destroy();
    }
  }
}

export async function revealPdf(filePath: string) {
  shell.showItemInFolder(filePath);
}
