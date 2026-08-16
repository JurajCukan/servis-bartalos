import type Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Lazy-loaded reference — must not be imported at module level
// because better-sqlite3 immediately resolves its native binding
// which fails inside an ASAR archive.
let BetterSqlite3: typeof import("better-sqlite3");
let db: Database.Database;

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(15);
  let id = "";
  for (let i = 0; i < 15; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export function initDatabase(userDataPath: string): void {
  const dbPath = path.join(userDataPath, "servis.db");
  console.log(`[database] Opening SQLite database at: ${dbPath}`);

  BetterSqlite3 = require("better-sqlite3");
  db = new BetterSqlite3(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      brand TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      year INTEGER DEFAULT NULL,
      vin TEXT DEFAULT NULL,
      license_plate TEXT NOT NULL DEFAULT '',
      current_mileage INTEGER NOT NULL DEFAULT 0,
      engine TEXT DEFAULT NULL,
      transmission TEXT DEFAULT NULL,
      drive TEXT DEFAULT NULL,
      power TEXT DEFAULT NULL,
      oil_volume TEXT DEFAULT NULL,
      tire_size TEXT DEFAULT NULL,
      fuel_type TEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'OK',
      photo TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
      date TEXT NOT NULL,
      mileage_at_service INTEGER NOT NULL DEFAULT 0,
      service_type TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      parts_replaced TEXT DEFAULT NULL,
      price REAL DEFAULT NULL,
      technician TEXT DEFAULT NULL,
      next_service_km INTEGER DEFAULT NULL,
      next_service_date TEXT DEFAULT NULL,
      photos_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
      planned_date TEXT DEFAULT NULL,
      planned_mileage INTEGER DEFAULT NULL,
      task_type TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'Normálna',
      status TEXT NOT NULL DEFAULT 'Čakajúce',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      street TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'Slovensko',
      ico TEXT,
      dic TEXT,
      ic_dph TEXT,
      bank_name TEXT,
      iban TEXT,
      bic_swift TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      logo_path TEXT,
      invoice_prefix TEXT NOT NULL DEFAULT 'FA',
      invoice_next_number INTEGER NOT NULL DEFAULT 1,
      vat_payer INTEGER NOT NULL DEFAULT 0,
      default_vat_rate REAL NOT NULL DEFAULT 20,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      invoice_date TEXT NOT NULL,
      due_date TEXT,
      service_record_id TEXT,
      vehicle_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      currency TEXT NOT NULL DEFAULT 'EUR',
      payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
      subtotal REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      internal_note TEXT,
      issued_at TEXT,
      paid_at TEXT,
      snapshot_json TEXT NOT NULL,
      pdf_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL,
      FOREIGN KEY (service_record_id) REFERENCES service_records(id) ON DELETE SET NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'ks',
      unit_price_without_vat REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 0,
      line_total_without_vat REAL NOT NULL DEFAULT 0,
      line_vat_amount REAL NOT NULL DEFAULT 0,
      line_total_with_vat REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_record_items (
      id TEXT PRIMARY KEY,
      service_record_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'ks',
      unit_price REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (service_record_id) REFERENCES service_records(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON invoices(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_service_record_items_record ON service_record_items(service_record_id);
  `);

  console.log("[database] Schema initialized successfully.");
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log("[database] Database closed.");
  }
}

// ─── Customers ──────────────────────────────────────────────────────────────

export function searchCustomers(query: string, limit = 20) {
  if (!query.trim()) {
    return db
      .prepare("SELECT * FROM customers ORDER BY last_name LIMIT ?")
      .all(limit);
  }
  const q = `%${query.trim()}%`;
  return db
    .prepare(
      "SELECT * FROM customers WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? ORDER BY last_name LIMIT ?"
    )
    .all(q, q, q, limit);
}

export function createCustomer(data: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}) {
  const id = generateId();
  db.prepare(
    "INSERT INTO customers (id, first_name, last_name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, data.first_name, data.last_name, data.phone, data.email ?? null, data.notes ?? null);
  return { id, ...data, created_at: new Date().toISOString() };
}

export function updateCustomer(
  id: string,
  data: { first_name?: string; last_name?: string; phone?: string; email?: string | null; notes?: string | null }
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.first_name !== undefined) { fields.push("first_name = ?"); values.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push("last_name = ?"); values.push(data.last_name); }
  if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone); }
  if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
  if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

// ─── Vehicles ───────────────────────────────────────────────────────────────

export function getVehiclesWithCustomers() {
  return (db
    .prepare(
      `SELECT v.*, c.first_name AS c_first_name, c.last_name AS c_last_name, c.phone AS c_phone,
              (SELECT COUNT(id) FROM scheduled_tasks st WHERE st.vehicle_id = v.id AND st.status = 'Čakajúce') as pending_tasks
       FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id
       ORDER BY v.created_at DESC`
    )
    .all() as Record<string, unknown>[]
  ).map((row) => ({
      id: row.id as string,
      brand: (row.brand as string) || "",
      model: (row.model as string) || "",
      year: row.year as number | null,
      vin: row.vin as string | null,
      license_plate: (row.license_plate as string) || "",
      current_mileage: (row.current_mileage as number) || 0,
      fuel_type: row.fuel_type as string | null,
      photo: row.photo as string | null,
      status: (row.pending_tasks as number) > 0 ? "NAPLÁNOVANÉ" : "OK",
      created_at: row.created_at as string,
      customer: row.c_first_name
        ? {
            first_name: row.c_first_name as string,
            last_name: row.c_last_name as string,
            phone: row.c_phone as string,
          }
        : null,
    }));
}

export function getVehicleDetail(vehicleId: string) {
  const row = db
    .prepare(
      `SELECT v.*, c.id AS c_id, c.first_name AS c_first_name, c.last_name AS c_last_name,
              c.phone AS c_phone, c.email AS c_email, c.notes AS c_notes,
              (SELECT COUNT(id) FROM scheduled_tasks st WHERE st.vehicle_id = v.id AND st.status = 'Čakajúce') as pending_tasks
       FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id
       WHERE v.id = ?`
    )
    .get(vehicleId) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    id: row.id as string,
    brand: (row.brand as string) || "",
    model: (row.model as string) || "",
    year: row.year as number | null,
    vin: row.vin as string | null,
    license_plate: (row.license_plate as string) || "",
    current_mileage: (row.current_mileage as number) || 0,
    status: (row.pending_tasks as number) > 0 ? "NAPLÁNOVANÉ" : "OK",
    photo: row.photo as string | null,
    notes: row.notes as string | null,
    engine: row.engine as string | null,
    transmission: row.transmission as string | null,
    power: row.power as string | null,
    drive: row.drive as string | null,
    oil_volume: row.oil_volume as string | null,
    tire_size: row.tire_size as string | null,
    fuel_type: row.fuel_type as string | null,
    created_at: row.created_at as string,
    customer: row.c_id
      ? {
          id: row.c_id as string,
          first_name: (row.c_first_name as string) || "",
          last_name: (row.c_last_name as string) || "",
          phone: (row.c_phone as string) || "",
          email: row.c_email as string | null,
          notes: row.c_notes as string | null,
        }
      : null,
  };
}

export function checkDuplicatePlate(plate: string, excludeId?: string) {
  if (excludeId) {
    return db
      .prepare("SELECT id FROM vehicles WHERE license_plate = ? AND id != ?")
      .get(plate, excludeId) as { id: string } | undefined;
  }
  return db
    .prepare("SELECT id FROM vehicles WHERE license_plate = ?")
    .get(plate) as { id: string } | undefined;
}

export function createVehicle(data: {
  customer_id: string;
  brand: string;
  model: string;
  year?: number | null;
  vin?: string | null;
  license_plate: string;
  current_mileage: number;
  engine?: string | null;
  transmission?: string | null;
  drive?: string | null;
  power?: string | null;
  oil_volume?: string | null;
  tire_size?: string | null;
  fuel_type?: string | null;
  notes?: string | null;
  photo?: string | null;
}) {
  const id = generateId();
  db.prepare(
    `INSERT INTO vehicles (id, customer_id, brand, model, year, vin, license_plate, current_mileage,
     engine, transmission, drive, power, oil_volume, tire_size, fuel_type, notes, status, photo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OK', ?)`
  ).run(
    id, data.customer_id, data.brand, data.model, data.year ?? null, data.vin ?? null,
    data.license_plate, data.current_mileage, data.engine ?? null, data.transmission ?? null,
    data.drive ?? null, data.power ?? null, data.oil_volume ?? null, data.tire_size ?? null,
    data.fuel_type ?? null, data.notes ?? null, data.photo ?? null
  );
  return id;
}

export function updateVehicle(
  id: string,
  data: Record<string, unknown>
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(val === undefined ? null : val);
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE vehicles SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteVehicleCascade(vehicleId: string) {
  const deleteInTransaction = db.transaction(() => {
    db.prepare("DELETE FROM scheduled_tasks WHERE vehicle_id = ?").run(vehicleId);
    db.prepare("DELETE FROM service_records WHERE vehicle_id = ?").run(vehicleId);
    db.prepare("DELETE FROM vehicles WHERE id = ?").run(vehicleId);
  });
  deleteInTransaction();
}

// ─── Service Records ────────────────────────────────────────────────────────

export function getServiceRecords(vehicleId: string) {
  return (db
    .prepare("SELECT * FROM service_records WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC")
    .all(vehicleId) as Record<string, unknown>[]
  ).map(mapServiceRecord);
}

export function getAllServiceRecords() {
  return (db
    .prepare(
      `SELECT sr.*, v.brand AS v_brand, v.model AS v_model, v.license_plate AS v_license_plate,
              c.first_name AS c_first_name, c.last_name AS c_last_name
       FROM service_records sr
       LEFT JOIN vehicles v ON sr.vehicle_id = v.id
       LEFT JOIN customers c ON v.customer_id = c.id
       ORDER BY sr.date DESC, sr.created_at DESC`
    )
    .all() as Record<string, unknown>[]
  ).map((row) => ({
      ...mapServiceRecord(row),
      vehicle: row.v_brand
        ? {
            brand: row.v_brand as string,
            model: row.v_model as string,
            license_plate: row.v_license_plate as string,
          }
        : null,
      customer: row.c_first_name
        ? { first_name: row.c_first_name as string, last_name: row.c_last_name as string }
        : null,
    }));
}

function mapServiceRecord(row: Record<string, unknown>) {
  const photos: string[] = JSON.parse((row.photos_json as string) || "[]");
  return {
    id: row.id as string,
    vehicle_id: row.vehicle_id as string,
    date: row.date ? (row.date as string).slice(0, 10) : "",
    mileage_at_service: (row.mileage_at_service as number) || 0,
    service_type: (row.service_type as string) || "",
    title: (row.title as string) || "",
    description: (row.description as string) || "",
    parts_replaced: row.parts_replaced as string | null,
    price: row.price as number | null,
    technician: row.technician as string | null,
    next_service_km: row.next_service_km as number | null,
    next_service_date: row.next_service_date ? (row.next_service_date as string).slice(0, 10) : null,
    photos,
    created_at: row.created_at as string,
  };
}

export function createServiceRecord(data: {
  vehicle_id: string;
  date: string;
  mileage_at_service: number;
  service_type: string;
  title: string;
  description: string;
  parts_replaced?: string | null;
  price?: number | null;
  technician?: string | null;
  next_service_km?: number | null;
  next_service_date?: string | null;
  photos?: string[];
}) {
  const id = generateId();
  db.prepare(
    `INSERT INTO service_records (id, vehicle_id, date, mileage_at_service, service_type, title,
     description, parts_replaced, price, technician, next_service_km, next_service_date, photos_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.vehicle_id, data.date, data.mileage_at_service, data.service_type, data.title,
    data.description, data.parts_replaced ?? null, data.price ?? null, data.technician ?? null,
    data.next_service_km ?? null, data.next_service_date ?? null, JSON.stringify(data.photos ?? [])
  );
  return id;
}

export function updateServiceRecord(
  id: string,
  data: Record<string, unknown>
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === "photos") {
      fields.push("photos_json = ?");
      values.push(JSON.stringify(val));
    } else {
      fields.push(`${key} = ?`);
      values.push(val === undefined ? null : val);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE service_records SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function getServiceRecordById(id: string) {
  const row = db.prepare("SELECT * FROM service_records WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapServiceRecord(row) : null;
}

export function deleteServiceRecord(id: string) {
  db.prepare("DELETE FROM service_records WHERE id = ?").run(id);
}

// ─── Scheduled Tasks ────────────────────────────────────────────────────────

export function getScheduledTasks(vehicleId: string) {
  return db
    .prepare("SELECT * FROM scheduled_tasks WHERE vehicle_id = ? ORDER BY planned_date")
    .all(vehicleId);
}

export function getAllActiveTasks() {
  return (db
    .prepare(
      `SELECT st.*, v.brand AS v_brand, v.model AS v_model, v.license_plate AS v_license_plate,
              c.first_name AS c_first_name, c.last_name AS c_last_name
       FROM scheduled_tasks st
       LEFT JOIN vehicles v ON st.vehicle_id = v.id
       LEFT JOIN customers c ON v.customer_id = c.id
       WHERE st.status != 'Zrušené'
       ORDER BY st.planned_date`
    )
    .all() as Record<string, unknown>[]
  ).map((row) => ({
      id: row.id as string,
      vehicle_id: row.vehicle_id as string,
      planned_date: row.planned_date as string | null,
      planned_mileage: row.planned_mileage as number | null,
      task_type: (row.task_type as string) || "",
      description: (row.description as string) || "",
      priority: (row.priority as string) || "Normálna",
      status: (row.status as string) || "Čakajúce",
      created_at: row.created_at as string,
      vehicle: row.v_brand
        ? { brand: row.v_brand as string, model: row.v_model as string, license_plate: row.v_license_plate as string }
        : null,
      customer: row.c_first_name
        ? { first_name: row.c_first_name as string, last_name: row.c_last_name as string }
        : null,
    }));
}

export function createScheduledTask(data: {
  vehicle_id: string;
  planned_date?: string | null;
  planned_mileage?: number | null;
  task_type: string;
  description: string;
  priority?: string;
  status?: string;
}) {
  const id = generateId();
  db.prepare(
    `INSERT INTO scheduled_tasks (id, vehicle_id, planned_date, planned_mileage, task_type, description, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.vehicle_id, data.planned_date ?? null, data.planned_mileage ?? null,
    data.task_type, data.description, data.priority ?? "Normálna", data.status ?? "Čakajúce"
  );
  return id;
}

export function updateTaskStatus(id: string, status: string) {
  db.prepare("UPDATE scheduled_tasks SET status = ? WHERE id = ?").run(status, id);
}

// ─── Export / Import ────────────────────────────────────────────────────────

export function exportAllData() {
  return {
    customers: db.prepare("SELECT * FROM customers").all(),
    vehicles: db.prepare("SELECT * FROM vehicles").all(),
    service_records: (db.prepare("SELECT * FROM service_records").all() as Record<string, unknown>[]).map(mapServiceRecord),
    scheduled_tasks: db.prepare("SELECT * FROM scheduled_tasks").all(),
  };
}

export function importData(bundle: {
  customers: Record<string, unknown>[];
  vehicles: Record<string, unknown>[];
  service_records: Record<string, unknown>[];
  scheduled_tasks: Record<string, unknown>[];
}) {
  const idMap: Record<string, string> = {};

  const importAll = db.transaction(() => {
    for (const c of bundle.customers) {
      const newId = generateId();
      idMap[c.id as string] = newId;
      db.prepare(
        "INSERT INTO customers (id, first_name, last_name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(newId, c.first_name, c.last_name, c.phone, c.email ?? null, c.notes ?? null);
    }

    for (const v of bundle.vehicles) {
      const newId = generateId();
      idMap[v.id as string] = newId;
      const customerId = idMap[v.customer_id as string] || (v.customer_id as string);
      db.prepare(
        `INSERT INTO vehicles (id, customer_id, brand, model, year, vin, license_plate, current_mileage,
         engine, transmission, drive, power, oil_volume, tire_size, fuel_type, notes, status, photo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, customerId, v.brand, v.model, v.year ?? null, v.vin ?? null,
        v.license_plate, v.current_mileage ?? 0, v.engine ?? null, v.transmission ?? null,
        v.drive ?? null, v.power ?? null, v.oil_volume ?? null, v.tire_size ?? null,
        v.fuel_type ?? null, v.notes ?? null, v.status ?? "OK", v.photo ?? null
      );
    }

    for (const sr of bundle.service_records) {
      const newId = generateId();
      idMap[sr.id as string] = newId;
      const vehicleId = idMap[sr.vehicle_id as string] || (sr.vehicle_id as string);
      const photos = Array.isArray(sr.photos) ? sr.photos : [];
      db.prepare(
        `INSERT INTO service_records (id, vehicle_id, date, mileage_at_service, service_type, title,
         description, parts_replaced, price, technician, next_service_km, next_service_date, photos_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, vehicleId, sr.date, sr.mileage_at_service ?? 0, sr.service_type, sr.title,
        sr.description, sr.parts_replaced ?? null, sr.price ?? null, sr.technician ?? null,
        sr.next_service_km ?? null, sr.next_service_date ?? null, JSON.stringify(photos)
      );
    }

    for (const st of bundle.scheduled_tasks) {
      const newId = generateId();
      idMap[st.id as string] = newId;
      const vehicleId = idMap[st.vehicle_id as string] || (st.vehicle_id as string);
      db.prepare(
        `INSERT INTO scheduled_tasks (id, vehicle_id, planned_date, planned_mileage, task_type, description, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, vehicleId, st.planned_date ?? null, st.planned_mileage ?? null,
        st.task_type, st.description, st.priority ?? "Normálna", st.status ?? "Čakajúce"
      );
    }
  });

  importAll();
  return idMap;
}

// ─── Company Settings ───────────────────────────────────────────────────────

export function getCompanySettings() {
  const row = db.prepare("SELECT * FROM company_settings LIMIT 1").get() as Record<string, unknown> | undefined;
  if (!row) {
    // Return default empty struct
    return {
      id: "default",
      company_name: "",
      street: "",
      city: "",
      postal_code: "",
      country: "Slovensko",
      ico: "",
      dic: "",
      ic_dph: "",
      bank_name: "",
      iban: "",
      bic_swift: "",
      phone: "",
      email: "",
      website: "",
      logo_path: "",
      invoice_prefix: "FA",
      invoice_next_number: 1,
      vat_payer: 0,
      default_vat_rate: 20,
    };
  }
  return row;
}

export function updateCompanySettings(data: Record<string, unknown>) {
  const row = db.prepare("SELECT id FROM company_settings LIMIT 1").get() as { id: string } | undefined;
  
  const fields: string[] = [];
  const values: unknown[] = [];
  
  for (const [key, val] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(val === undefined ? null : val);
  }
  
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  
  if (row) {
    values.push(row.id);
    db.prepare(`UPDATE company_settings SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  } else {
    const cols = Object.keys(data);
    const placeholders = cols.map(() => "?");
    
    cols.push("id", "updated_at");
    placeholders.push("?", "?");
    
    const insertValues = Object.values(data).map(v => v === undefined ? null : v);
    insertValues.push("default", new Date().toISOString());
    
    db.prepare(`INSERT INTO company_settings (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`).run(...insertValues);
  }
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export function getAllInvoices() {
  return db.prepare(`
    SELECT i.*, 
           c.first_name AS c_first_name, c.last_name AS c_last_name, 
           v.brand AS v_brand, v.model AS v_model, v.license_plate AS v_license_plate
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    ORDER BY i.created_at DESC
  `).all();
}

export function getInvoiceById(id: string) {
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as any;
  if (!invoice) return null;
  
  const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position ASC").all(id);
  return { ...invoice, items };
}

export function createInvoiceDraft(data: Record<string, unknown>, items: Record<string, unknown>[]) {
  const id = generateId();
  
  const createInTransaction = db.transaction(() => {
    // Generate dummy invoice number for draft (won't be shown, but UNIQUE constraint requires it)
    const draftNumber = `DRAFT-${id.substring(0, 8)}`;
    
    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, invoice_date, due_date, service_record_id, vehicle_id, customer_id, 
        status, currency, payment_method, subtotal, vat_rate, vat_amount, total_amount, 
        notes, internal_note, snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, draftNumber, data.invoice_date, data.due_date ?? null, data.service_record_id ?? null,
      data.vehicle_id, data.customer_id, 'draft', data.currency ?? 'EUR', data.payment_method ?? 'bank_transfer',
      data.subtotal ?? 0, data.vat_rate ?? 0, data.vat_amount ?? 0, data.total_amount ?? 0,
      data.notes ?? null, data.internal_note ?? null, data.snapshot_json ?? '{}',
      new Date().toISOString(), new Date().toISOString()
    );
    
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, position, item_type, name, description, quantity, unit, 
        unit_price_without_vat, vat_rate, line_total_without_vat, line_vat_amount, line_total_with_vat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const [index, item] of items.entries()) {
      insertItem.run(
        generateId(), id, index + 1, item.item_type, item.name, item.description ?? null,
        item.quantity ?? 1, item.unit ?? 'ks', item.unit_price_without_vat ?? 0, item.vat_rate ?? 0,
        item.line_total_without_vat ?? 0, item.line_vat_amount ?? 0, item.line_total_with_vat ?? 0
      );
    }
  });
  
  createInTransaction();
  return id;
}

export function issueInvoice(id: string, snapshotJson: string) {
  const issueInTransaction = db.transaction(() => {
    const settings = db.prepare("SELECT invoice_prefix, invoice_next_number FROM company_settings LIMIT 1").get() as any;
    if (!settings) throw new Error("Firemné údaje nie sú nastavené.");
    
    const year = new Date().getFullYear();
    const number = String(settings.invoice_next_number).padStart(5, "0");
    const invoiceNumber = `${settings.invoice_prefix}-${year}-${number}`;
    
    db.prepare("UPDATE company_settings SET invoice_next_number = invoice_next_number + 1, updated_at = ?").run(new Date().toISOString());
    
    db.prepare(`
      UPDATE invoices 
      SET invoice_number = ?, status = 'issued', issued_at = ?, snapshot_json = ?, updated_at = ? 
      WHERE id = ?
    `).run(invoiceNumber, new Date().toISOString(), snapshotJson, new Date().toISOString(), id);
    
    return invoiceNumber;
  });
  
  return issueInTransaction();
}

export function updateInvoice(id: string, data: Record<string, unknown>, items?: Record<string, unknown>[]) {
  const updateInTransaction = db.transaction(() => {
    const fields: string[] = [];
    const values: unknown[] = [];
    
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val === undefined ? null : val);
    }
    
    if (fields.length > 0) {
      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);
      db.prepare(`UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }
    
    if (items) {
      db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
      
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, position, item_type, name, description, quantity, unit, 
          unit_price_without_vat, vat_rate, line_total_without_vat, line_vat_amount, line_total_with_vat
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const [index, item] of items.entries()) {
        insertItem.run(
          generateId(), id, index + 1, item.item_type, item.name, item.description ?? null,
          item.quantity ?? 1, item.unit ?? 'ks', item.unit_price_without_vat ?? 0, item.vat_rate ?? 0,
          item.line_total_without_vat ?? 0, item.line_vat_amount ?? 0, item.line_total_with_vat ?? 0
        );
      }
    }
  });
  
  updateInTransaction();
}

export function deleteInvoice(id: string) {
  db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
}

// ─── Service Record Items ───────────────────────────────────────────────────

export function getServiceRecordItems(recordId: string) {
  return db.prepare("SELECT * FROM service_record_items WHERE service_record_id = ? ORDER BY position ASC").all(recordId);
}

export function saveServiceRecordItems(recordId: string, items: Record<string, unknown>[]) {
  const saveInTransaction = db.transaction(() => {
    db.prepare("DELETE FROM service_record_items WHERE service_record_id = ?").run(recordId);
    
    if (!items || items.length === 0) return;
    
    const insertItem = db.prepare(`
      INSERT INTO service_record_items (
        id, service_record_id, position, item_type, name, description, quantity, unit, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const [index, item] of items.entries()) {
      insertItem.run(
        generateId(), recordId, index + 1, item.item_type, item.name, item.description ?? null,
        item.quantity ?? 1, item.unit ?? 'ks', item.unit_price ?? 0, item.total_price ?? 0
      );
    }
  });
  
  saveInTransaction();
}
