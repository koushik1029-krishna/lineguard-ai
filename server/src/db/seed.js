import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { incidents } from '../data/incidents.js';
import { documents } from '../data/documents.js';
import { openDatabase, resolveDbPath } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function insertSeed(db) {
  const now = new Date().toISOString();
  const insertIncident = db.prepare(`
    INSERT INTO incidents (
      production_line, equipment, category, severity, status, description,
      occurred_at, resolution_notes, resolved_at, reported_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertDocument = db.prepare(`
    INSERT INTO documents (
      document_code, title, equipment, category, doc_type, body, approved
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    for (const incident of incidents) {
      insertIncident.run(
        incident.production_line,
        incident.equipment,
        incident.category,
        incident.severity,
        incident.status,
        incident.description,
        incident.occurred_at,
        incident.resolution_notes,
        incident.resolved_at,
        incident.reported_by,
        incident.occurred_at,
        incident.resolved_at || incident.occurred_at || now,
      );
    }
    for (const document of documents) {
      insertDocument.run(
        document.document_code,
        document.title,
        document.equipment,
        document.category,
        document.doc_type,
        document.body,
        document.approved,
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return { incidents: incidents.length, documents: documents.length };
}

export function seedIfEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM incidents').get();
  if (row.count > 0) return null;
  db.exec('DELETE FROM documents');
  return insertSeed(db);
}

export function resetSeed(db) {
  db.exec('DELETE FROM incidents');
  db.exec('DELETE FROM documents');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('incidents', 'documents')");
  return insertSeed(db);
}

const isDirect =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirect) {
  const db = openDatabase(resolveDbPath());
  const result = resetSeed(db);
  console.log(
    `Reset the database and seeded ${result.incidents} incidents and ${result.documents} maintenance documents.`,
  );
  console.log(`Database file: ${resolveDbPath()}`);
}
