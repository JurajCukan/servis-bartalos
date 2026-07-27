// ─── Types ───────────────────────────────────────────────────────────────────

type ProgressCallback = (message: string, percent: number) => void;

interface MediaEntry {
  collection: string;
  recordId: string;
  field: string;
  filename: string;
  /** base64-encoded file content */
  data: string;
}

interface ExportBundle {
  version: 1;
  exportedAt: string;
  appVersion: string;
  customers: Record<string, unknown>[];
  vehicles: Record<string, unknown>[];
  service_records: Record<string, unknown>[];
  scheduled_tasks: Record<string, unknown>[];
  media: MediaEntry[];
}

// CSV escape: wrap in quotes if contains comma, quote, or newline
function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function recordsToCsv(records: Record<string, unknown>[]): string {
  if (records.length === 0) return "";
  const headers = Object.keys(records[0]);
  const lines = [headers.map(csvEscape).join(",")];
  for (const rec of records) {
    const values = headers.map((h) => {
      const val = rec[h];
      // Arrays (like photos) get joined with semicolons
      if (Array.isArray(val)) return csvEscape(val.join(";"));
      return csvEscape(val);
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export async function exportData(onProgress?: ProgressCallback): Promise<void> {
  // Check Electron API availability
  if (typeof window === "undefined" || !window.electronAPI) {
    throw new Error("Export je dostupný iba v desktopovej aplikácii.");
  }

  onProgress?.("Pripravujem export (získavam dáta z databázy)…", 25);
  
  const bundle = (await window.electronAPI.db.exportAllData()) as ExportBundle;

  onProgress?.("Pripravujem CSV súbory…", 85);

  const customersCsv = recordsToCsv(bundle.customers);
  const vehiclesCsv = recordsToCsv(bundle.vehicles);
  const serviceRecordsCsv = recordsToCsv(bundle.service_records);
  const scheduledTasksCsv = recordsToCsv(bundle.scheduled_tasks);

  // Ask user where to save
  const timestamp = new Date().toISOString().slice(0, 10);
  const result = await window.electronAPI.showSaveDialog({
    title: "Exportovať údaje",
    defaultPath: `servis-bartalos-export-${timestamp}`,
    filters: [{ name: "Servisná knižka export", extensions: ["json"] }],
  });

  if (result.canceled || !result.filePath) return;

  onProgress?.("Ukladám exportný súbor…", 90);

  // Write main JSON bundle
  const jsonContent = JSON.stringify(bundle, null, 2);
  await window.electronAPI.writeFile(
    result.filePath,
    btoa(unescape(encodeURIComponent(jsonContent))),
    "base64",
  );

  // Also write CSV files alongside the JSON for easy readability
  const basePath = result.filePath.replace(/\.json$/, "");

  if (customersCsv) {
    await window.electronAPI.writeFile(
      `${basePath}_customers.csv`,
      btoa(unescape(encodeURIComponent("\uFEFF" + customersCsv))),
      "base64",
    );
  }
  if (vehiclesCsv) {
    await window.electronAPI.writeFile(
      `${basePath}_vehicles.csv`,
      btoa(unescape(encodeURIComponent("\uFEFF" + vehiclesCsv))),
      "base64",
    );
  }
  if (serviceRecordsCsv) {
    await window.electronAPI.writeFile(
      `${basePath}_service_records.csv`,
      btoa(unescape(encodeURIComponent("\uFEFF" + serviceRecordsCsv))),
      "base64",
    );
  }
  if (scheduledTasksCsv) {
    await window.electronAPI.writeFile(
      `${basePath}_scheduled_tasks.csv`,
      btoa(unescape(encodeURIComponent("\uFEFF" + scheduledTasksCsv))),
      "base64",
    );
  }

  onProgress?.("Export dokončený!", 100);
}

// ─── IMPORT ──────────────────────────────────────────────────────────────────

export async function importData(onProgress?: ProgressCallback): Promise<{ imported: number }> {
  if (typeof window === "undefined" || !window.electronAPI) {
    throw new Error("Import je dostupný iba v desktopovej aplikácii.");
  }

  const result = await window.electronAPI.showOpenDialog({
    title: "Importovať údaje",
    filters: [{ name: "Servisná knižka export", extensions: ["json"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { imported: 0 };
  }

  onProgress?.("Čítam exportný súbor…", 20);

  const base64 = await window.electronAPI.readFile(result.filePaths[0]);
  const jsonStr = decodeURIComponent(escape(atob(base64)));
  const bundle: ExportBundle = JSON.parse(jsonStr);

  if (bundle.version !== 1) {
    throw new Error(`Nepodporovaná verzia exportu: ${bundle.version}`);
  }

  onProgress?.("Importujem dáta a fotografie…", 50);

  const importResult = await window.electronAPI.db.importData(bundle);

  onProgress?.("Import dokončený!", 100);
  return importResult as { imported: number };
}
