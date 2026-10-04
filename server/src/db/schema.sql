CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_line TEXT NOT NULL,
  equipment TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  description TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  resolution_notes TEXT,
  resolved_at TEXT,
  reported_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  equipment TEXT,
  category TEXT,
  doc_type TEXT NOT NULL,
  body TEXT NOT NULL,
  approved INTEGER NOT NULL DEFAULT 1 CHECK (approved IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_equipment ON incidents(equipment);
CREATE INDEX IF NOT EXISTS idx_documents_equipment ON documents(equipment);
