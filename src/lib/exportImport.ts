import pb, { fileUrl } from "@/lib/pocketbase";
import type { RecordModel } from "pocketbase";

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

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }

  const headers = parseLine(lines[0]);
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, j) => {
      rec[h] = values[j] ?? "";
    });
    records.push(rec);
  }
  return records;
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchAll(collection: string): Promise<RecordModel[]> {
  return pb.collection(collection).getFullList({ batch: 200 });
}

function stripSystemFields(record: RecordModel): Record<string, unknown> {
  // Keep id but remove PocketBase system metadata fields
  const { collectionId, collectionName, expand, ...rest } = record as Record<string, unknown> & {
    collectionId?: string;
    collectionName?: string;
    expand?: unknown;
  };
  void collectionId;
  void collectionName;
  void expand;
  return rest;
}

async function downloadFile(
  collection: string,
  recordId: string,
  filename: string,
): Promise<string> {
  const url = fileUrl({ id: recordId, collectionId: "", collectionName: collection } as RecordModel, filename);
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1] ?? "";
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export async function exportData(onProgress?: ProgressCallback): Promise<void> {
  // Check Electron API availability
  if (typeof window === "undefined" || !window.electronAPI) {
    throw new Error("Export je dostupný iba v desktopovej aplikácii.");
  }

  onProgress?.("Načítavam zákazníkov…", 5);
  const customers = await fetchAll("customers");

  onProgress?.("Načítavam vozidlá…", 15);
  const vehicles = await fetchAll("vehicles");

  onProgress?.("Načítavam servisné záznamy…", 25);
  const serviceRecords = await fetchAll("service_records");

  onProgress?.("Načítavam plánované úlohy…", 35);
  const scheduledTasks = await fetchAll("scheduled_tasks");

  // Download all media files
  onProgress?.("Sťahujem fotografie…", 40);
  const media: MediaEntry[] = [];
  let mediaTotal = 0;
  let mediaDone = 0;

  // Count total media files
  for (const v of vehicles) {
    if (v.photo) mediaTotal++;
  }
  for (const sr of serviceRecords) {
    if (Array.isArray(sr.photos)) mediaTotal += sr.photos.length;
  }

  // Download vehicle photos
  for (const v of vehicles) {
    if (v.photo && typeof v.photo === "string") {
      try {
        const data = await downloadFile("vehicles", v.id, v.photo);
        media.push({
          collection: "vehicles",
          recordId: v.id,
          field: "photo",
          filename: v.photo,
          data,
        });
      } catch (e) {
        console.warn(`Failed to download vehicle photo ${v.photo}:`, e);
      }
      mediaDone++;
      const pct = 40 + Math.round((mediaDone / Math.max(mediaTotal, 1)) * 40);
      onProgress?.(`Sťahujem fotografie (${mediaDone}/${mediaTotal})…`, pct);
    }
  }

  // Download service record photos
  for (const sr of serviceRecords) {
    if (Array.isArray(sr.photos)) {
      for (const photo of sr.photos) {
        try {
          const data = await downloadFile("service_records", sr.id, photo);
          media.push({
            collection: "service_records",
            recordId: sr.id,
            field: "photos",
            filename: photo,
            data,
          });
        } catch (e) {
          console.warn(`Failed to download service record photo ${photo}:`, e);
        }
        mediaDone++;
        const pct = 40 + Math.round((mediaDone / Math.max(mediaTotal, 1)) * 40);
        onProgress?.(`Sťahujem fotografie (${mediaDone}/${mediaTotal})…`, pct);
      }
    }
  }

  onProgress?.("Pripravujem CSV súbory…", 85);

  // Build CSV content for each collection
  const customersClean = customers.map(stripSystemFields);
  const vehiclesClean = vehicles.map(stripSystemFields);
  const serviceRecordsClean = serviceRecords.map(stripSystemFields);
  const scheduledTasksClean = scheduledTasks.map(stripSystemFields);

  const customersCsv = recordsToCsv(customersClean);
  const vehiclesCsv = recordsToCsv(vehiclesClean);
  const serviceRecordsCsv = recordsToCsv(serviceRecordsClean);
  const scheduledTasksCsv = recordsToCsv(scheduledTasksClean);

  // Build the export bundle as JSON (includes CSV data + media)
  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: await getAppVersion(),
    customers: customersClean,
    vehicles: vehiclesClean,
    service_records: serviceRecordsClean,
    scheduled_tasks: scheduledTasksClean,
    media,
  };

  // Ask user where to save
  const timestamp = new Date().toISOString().slice(0, 10);
  const result = await window.electronAPI.showSaveDialog({
    title: "Exportovať údaje",
    defaultPath: `servis-bartalos-export-${timestamp}`,
    filters: [
      { name: "Servisná knižka export", extensions: ["json"] },
    ],
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
    filters: [
      { name: "Servisná knižka export", extensions: ["json"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { imported: 0 };
  }

  onProgress?.("Čítam exportný súbor…", 5);

  const base64 = await window.electronAPI.readFile(result.filePaths[0]);
  const jsonStr = decodeURIComponent(escape(atob(base64)));
  const bundle: ExportBundle = JSON.parse(jsonStr);

  if (bundle.version !== 1) {
    throw new Error(`Nepodporovaná verzia exportu: ${bundle.version}`);
  }

  let totalImported = 0;
  const idMap: Record<string, string> = {}; // oldId -> newId

  // 1. Import customers
  onProgress?.("Importujem zákazníkov…", 10);
  for (const customer of bundle.customers) {
    const oldId = customer.id as string;
    const { id, created, updated, ...data } = customer;
    void id; void created; void updated;
    try {
      const created = await pb.collection("customers").create(data);
      idMap[oldId] = created.id;
      totalImported++;
    } catch (e) {
      console.warn(`Failed to import customer ${oldId}:`, e);
    }
  }

  // 2. Import vehicles (re-link customer relation)
  onProgress?.("Importujem vozidlá…", 30);
  for (const vehicle of bundle.vehicles) {
    const oldId = vehicle.id as string;
    const { id, created, updated, photo, ...data } = vehicle;
    void id; void created; void updated;
    // Re-link customer
    if (data.customer && idMap[data.customer as string]) {
      data.customer = idMap[data.customer as string];
    }
    // Don't include photo filename — will upload separately
    try {
      const created = await pb.collection("vehicles").create(data);
      idMap[oldId] = created.id;
      totalImported++;
    } catch (e) {
      console.warn(`Failed to import vehicle ${oldId}:`, e);
    }
  }

  // 3. Import service_records (re-link vehicle relation)
  onProgress?.("Importujem servisné záznamy…", 50);
  for (const sr of bundle.service_records) {
    const oldId = sr.id as string;
    const { id, created, updated, photos, ...data } = sr;
    void id; void created; void updated;
    if (data.vehicle && idMap[data.vehicle as string]) {
      data.vehicle = idMap[data.vehicle as string];
    }
    try {
      const created = await pb.collection("service_records").create(data);
      idMap[oldId] = created.id;
      totalImported++;
    } catch (e) {
      console.warn(`Failed to import service record ${oldId}:`, e);
    }
  }

  // 4. Import scheduled_tasks (re-link vehicle relation)
  onProgress?.("Importujem plánované úlohy…", 65);
  for (const task of bundle.scheduled_tasks) {
    const oldId = task.id as string;
    const { id, created, updated, ...data } = task;
    void id; void created; void updated;
    if (data.vehicle && idMap[data.vehicle as string]) {
      data.vehicle = idMap[data.vehicle as string];
    }
    try {
      const created = await pb.collection("scheduled_tasks").create(data);
      idMap[oldId] = created.id;
      totalImported++;
    } catch (e) {
      console.warn(`Failed to import scheduled task ${oldId}:`, e);
    }
  }

  // 5. Upload media files
  if (bundle.media && bundle.media.length > 0) {
    onProgress?.("Nahrávam fotografie…", 75);
    let mediaDone = 0;
    const mediaTotal = bundle.media.length;

    for (const entry of bundle.media) {
      const newRecordId = idMap[entry.recordId];
      if (!newRecordId) {
        console.warn(`Skipping media for missing record ${entry.recordId}`);
        mediaDone++;
        continue;
      }

      try {
        // Convert base64 to blob
        const binary = atob(entry.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        // Determine mime type from extension
        const ext = entry.filename.split(".").pop()?.toLowerCase() ?? "";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        const mime = mimeMap[ext] || "application/octet-stream";
        const blob = new Blob([bytes], { type: mime });
        const file = new File([blob], entry.filename, { type: mime });

        const fd = new FormData();
        fd.append(entry.field, file);
        await pb.collection(entry.collection).update(newRecordId, fd);
      } catch (e) {
        console.warn(`Failed to upload media ${entry.filename}:`, e);
      }
      mediaDone++;
      const pct = 75 + Math.round((mediaDone / mediaTotal) * 20);
      onProgress?.(`Nahrávam fotografie (${mediaDone}/${mediaTotal})…`, pct);
    }
  }

  onProgress?.("Import dokončený!", 100);
  return { imported: totalImported };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAppVersion(): Promise<string> {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      return await window.electronAPI.getAppVersion();
    } catch {
      return "unknown";
    }
  }
  return "unknown";
}
