migrate((app) => {
  const collections = [
    {
      "id": "pbc_customers",
      "name": "customers",
      "type": "base",
      "system": false,
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "fields": [
        { "name": "id", "type": "text", "required": true, "system": true, "primaryKey": true, "autogeneratePattern": "[a-z0-9]{15}" },
        { "name": "first_name", "type": "text", "required": true, "min": 1, "max": 120 },
        { "name": "last_name", "type": "text", "required": true, "min": 1, "max": 120 },
        { "name": "phone", "type": "text", "required": true, "min": 1, "max": 40 },
        { "name": "email", "type": "email" },
        { "name": "notes", "type": "text", "max": 4000 }
      ],
      "indexes": [
        "CREATE INDEX idx_customers_last_name ON customers (last_name)"
      ]
    },
    {
      "id": "pbc_vehicles",
      "name": "vehicles",
      "type": "base",
      "system": false,
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "fields": [
        { "name": "id", "type": "text", "required": true, "system": true, "primaryKey": true, "autogeneratePattern": "[a-z0-9]{15}" },
        { "name": "customer", "type": "relation", "required": true, "collectionId": "pbc_customers", "cascadeDelete": true, "minSelect": 1, "maxSelect": 1 },
        { "name": "brand", "type": "text", "required": true, "min": 1, "max": 80 },
        { "name": "model", "type": "text", "required": true, "min": 1, "max": 80 },
        { "name": "year", "type": "number", "min": 1900, "max": 2100, "noDecimal": true },
        { "name": "vin", "type": "text", "max": 32 },
        { "name": "license_plate", "type": "text", "required": true, "min": 1, "max": 16 },
        { "name": "current_mileage", "type": "number", "required": true, "min": 0, "max": 2000000, "noDecimal": true },
        { "name": "fuel_type", "type": "select", "maxSelect": 1, "values": ["benzín", "diesel", "hybrid", "elektro", "LPG"] },
        { "name": "status", "type": "select", "required": true, "maxSelect": 1, "values": ["OK", "SERVIS NUTNÝ", "NAPLÁNOVANÉ", "ARCHÍV"] },
        { "name": "photo", "type": "file", "maxSelect": 1, "maxSize": 10485760, "mimeTypes": ["image/jpeg", "image/png", "image/webp"], "thumbs": ["200x200", "800x0"] },
        { "name": "engine", "type": "text", "max": 120 },
        { "name": "transmission", "type": "text", "max": 80 },
        { "name": "power", "type": "text", "max": 40 },
        { "name": "drive", "type": "text", "max": 40 },
        { "name": "oil_volume", "type": "text", "max": 40 },
        { "name": "tire_size", "type": "text", "max": 40 },
        { "name": "notes", "type": "text", "max": 4000 }
      ],
      "indexes": [
        "CREATE UNIQUE INDEX idx_vehicles_license_plate ON vehicles (license_plate)",
        "CREATE INDEX idx_vehicles_customer ON vehicles (customer)",
        "CREATE INDEX idx_vehicles_status ON vehicles (status)"
      ]
    },
    {
      "id": "pbc_service_records",
      "name": "service_records",
      "type": "base",
      "system": false,
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "fields": [
        { "name": "id", "type": "text", "required": true, "system": true, "primaryKey": true, "autogeneratePattern": "[a-z0-9]{15}" },
        { "name": "vehicle", "type": "relation", "required": true, "collectionId": "pbc_vehicles", "cascadeDelete": true, "minSelect": 1, "maxSelect": 1 },
        { "name": "date", "type": "date", "required": true },
        { "name": "mileage_at_service", "type": "number", "required": true, "min": 0, "max": 2000000, "noDecimal": true },
        { "name": "service_type", "type": "text", "required": true, "min": 1, "max": 80 },
        { "name": "title", "type": "text", "required": true, "min": 1, "max": 120 },
        { "name": "description", "type": "text", "required": true, "min": 1, "max": 4000 },
        { "name": "parts_replaced", "type": "text", "max": 4000 },
        { "name": "price", "type": "number", "min": 0, "max": 1000000 },
        { "name": "technician", "type": "text", "max": 120 },
        { "name": "next_service_km", "type": "number", "min": 0, "max": 2000000, "noDecimal": true },
        { "name": "next_service_date", "type": "date" },
        { "name": "photos", "type": "file", "maxSelect": 10, "maxSize": 10485760, "mimeTypes": ["image/jpeg", "image/png", "image/webp"], "thumbs": ["200x200", "800x0"] }
      ],
      "indexes": [
        "CREATE INDEX idx_service_records_vehicle ON service_records (vehicle)",
        "CREATE INDEX idx_service_records_date ON service_records (date)"
      ]
    },
    {
      "id": "pbc_scheduled_tasks",
      "name": "scheduled_tasks",
      "type": "base",
      "system": false,
      "listRule": "",
      "viewRule": "",
      "createRule": "",
      "updateRule": "",
      "deleteRule": "",
      "fields": [
        { "name": "id", "type": "text", "required": true, "system": true, "primaryKey": true, "autogeneratePattern": "[a-z0-9]{15}" },
        { "name": "vehicle", "type": "relation", "required": true, "collectionId": "pbc_vehicles", "cascadeDelete": true, "minSelect": 1, "maxSelect": 1 },
        { "name": "planned_date", "type": "date", "required": true },
        { "name": "planned_mileage", "type": "number", "min": 0, "max": 2000000, "noDecimal": true },
        { "name": "task_type", "type": "text", "required": true, "min": 1, "max": 80 },
        { "name": "description", "type": "text", "required": true, "min": 1, "max": 4000 },
        { "name": "priority", "type": "select", "required": true, "maxSelect": 1, "values": ["Nízka", "Stredná", "Vysoká"] },
        { "name": "status", "type": "select", "required": true, "maxSelect": 1, "values": ["Čakajúce", "Dokončené", "Zrušené"] }
      ],
      "indexes": [
        "CREATE INDEX idx_scheduled_tasks_vehicle ON scheduled_tasks (vehicle)",
        "CREATE INDEX idx_scheduled_tasks_planned_date ON scheduled_tasks (planned_date)",
        "CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks (status)"
      ]
    }
  ];

  return app.importCollections(collections, false);
});
