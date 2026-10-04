import { validateFilters, validateIncident, validateResolution } from './validation.js';

const INCIDENT_COLUMNS = `
  id, production_line, equipment, category, severity, status, description,
  occurred_at, resolution_notes, resolved_at, reported_by, created_at, updated_at
`;

export function listIncidents(db, query) {
  const errors = validateFilters(query);
  if (Object.keys(errors).length > 0) {
    return { error: 'validation', errors };
  }

  const q = text(query.q).toLowerCase();
  const status = text(query.status);
  const severity = text(query.severity);
  const line = text(query.production_line);
  const category = text(query.category);
  const like = `%${q.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;

  const incidents = db
    .prepare(
      `
      SELECT ${INCIDENT_COLUMNS}
      FROM incidents
      WHERE (
        ? = ''
        OR lower(equipment) LIKE ? ESCAPE '\\'
        OR lower(production_line) LIKE ? ESCAPE '\\'
        OR lower(category) LIKE ? ESCAPE '\\'
        OR lower(description) LIKE ? ESCAPE '\\'
        OR lower(COALESCE(resolution_notes, '')) LIKE ? ESCAPE '\\'
        OR lower(reported_by) LIKE ? ESCAPE '\\'
      )
      AND (? = '' OR status = ?)
      AND (? = '' OR severity = ?)
      AND (? = '' OR production_line = ?)
      AND (? = '' OR category = ?)
      ORDER BY occurred_at DESC, id DESC
    `,
    )
    .all(
      q,
      like,
      like,
      like,
      like,
      like,
      like,
      status,
      status,
      severity,
      severity,
      line,
      line,
      category,
      category,
    );

  const total = db.prepare('SELECT COUNT(*) AS count FROM incidents').get().count;
  return { incidents, total };
}

export function getIncident(db, id) {
  return db.prepare(`SELECT ${INCIDENT_COLUMNS} FROM incidents WHERE id = ?`).get(id) || null;
}

export function createIncident(db, input) {
  const errors = validateIncident(input);
  if (Object.keys(errors).length > 0) {
    return { error: 'validation', errors };
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `
      INSERT INTO incidents (
        production_line, equipment, category, severity, status, description,
        occurred_at, resolution_notes, resolved_at, reported_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Open', ?, ?, NULL, NULL, ?, ?, ?)
    `,
    )
    .run(
      input.production_line.trim(),
      input.equipment.trim(),
      input.category.trim(),
      input.severity.trim(),
      input.description.trim(),
      new Date(input.occurred_at).toISOString(),
      input.reported_by.trim(),
      now,
      now,
    );

  return { incident: getIncident(db, Number(result.lastInsertRowid)) };
}

export function updateIncident(db, id, input) {
  const existing = getIncident(db, id);
  if (!existing) return { error: 'not_found' };

  const errors = validateResolution(input, existing);
  if (Object.keys(errors).length > 0) {
    return { error: 'validation', errors };
  }

  const status = input.status.trim();
  const notes = Object.prototype.hasOwnProperty.call(input, 'resolution_notes')
    ? text(input.resolution_notes)
    : text(existing.resolution_notes);
  const resolvedAt = status === 'Resolved' ? existing.resolved_at || new Date().toISOString() : null;

  db.prepare(
    `
      UPDATE incidents
      SET status = ?, resolution_notes = ?, resolved_at = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(status, notes || null, resolvedAt, new Date().toISOString(), id);

  return { incident: getIncident(db, id) };
}

export function dashboard(db) {
  const counts = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END), 0) AS open,
        COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved,
        COALESCE(SUM(CASE WHEN severity = 'Critical' AND status != 'Resolved' THEN 1 ELSE 0 END), 0) AS critical_open
      FROM incidents
    `,
    )
    .get();

  const recent = db
    .prepare(
      `
      SELECT ${INCIDENT_COLUMNS}
      FROM incidents
      ORDER BY occurred_at DESC, id DESC
      LIMIT 6
    `,
    )
    .all();

  return {
    counts: {
      total: Number(counts.total),
      open: Number(counts.open),
      in_progress: Number(counts.in_progress),
      resolved: Number(counts.resolved),
      critical_open: Number(counts.critical_open),
    },
    recent,
  };
}

export function allIncidents(db) {
  return db.prepare(`SELECT ${INCIDENT_COLUMNS} FROM incidents`).all();
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}
