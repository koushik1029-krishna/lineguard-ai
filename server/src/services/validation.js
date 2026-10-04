import { CATEGORIES, LINES, SEVERITIES, STATUSES, equipmentForLine } from '../constants.js';

const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 2000;
const NOTES_MIN = 15;
const SEARCH_MAX = 120;

export function validateIncident(input) {
  const errors = {};
  const line = text(input.production_line);
  const equipment = text(input.equipment);
  const category = text(input.category);
  const severity = text(input.severity);
  const description = text(input.description);
  const reportedBy = text(input.reported_by);
  const occurredAt = text(input.occurred_at);

  if (!line || !LINES.some((item) => item.name === line)) {
    errors.production_line = 'Choose a production line.';
  }

  if (!equipment) {
    errors.equipment = 'Choose the equipment that failed.';
  } else if (line && !equipmentForLine(line).includes(equipment)) {
    errors.equipment = 'Choose equipment that belongs to the selected production line.';
  }

  if (!CATEGORIES.includes(category)) {
    errors.category = 'Choose an issue category.';
  }

  if (!SEVERITIES.includes(severity)) {
    errors.severity = 'Choose a severity.';
  }

  if (!description) {
    errors.description = 'Describe what happened.';
  } else if (description.length < DESCRIPTION_MIN) {
    errors.description = 'Describe what happened in at least 20 characters.';
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }

  if (!reportedBy) {
    errors.reported_by = 'Enter your name so technicians know who reported this.';
  } else if (reportedBy.length < 2) {
    errors.reported_by = 'Enter your name so technicians know who reported this.';
  } else if (reportedBy.length > 80) {
    errors.reported_by = 'Name must be 80 characters or fewer.';
  } else if (!/\p{L}/u.test(reportedBy)) {
    errors.reported_by = 'Enter the name of the person reporting this incident.';
  }

  if (!occurredAt) {
    errors.occurred_at = 'Enter when the incident happened.';
  } else {
    const when = new Date(occurredAt);
    if (Number.isNaN(when.getTime())) {
      errors.occurred_at = 'Enter a valid date and time.';
    } else if (when.getTime() > Date.now() + 2 * 60 * 1000) {
      errors.occurred_at = 'That time is in the future. Use the time the fault was observed.';
    }
  }

  return errors;
}

export function validateResolution(input, existing = {}) {
  const errors = {};
  const status = text(input.status);
  if (
    Object.prototype.hasOwnProperty.call(input, 'resolution_notes') &&
    input.resolution_notes != null &&
    typeof input.resolution_notes !== 'string'
  ) {
    errors.resolution_notes = 'Resolution notes must be plain text.';
  }
  const notes = Object.prototype.hasOwnProperty.call(input, 'resolution_notes')
    ? text(input.resolution_notes)
    : text(existing.resolution_notes);

  if (!STATUSES.includes(status)) {
    errors.status = 'Choose a status of Open, In Progress, or Resolved.';
  }

  if (notes.length > DESCRIPTION_MAX) {
    errors.resolution_notes = 'Resolution notes must be 2000 characters or fewer.';
  }

  if (status === 'Resolved' && notes.length < NOTES_MIN) {
    errors.resolution_notes =
      'Add resolution notes of at least 15 characters before marking this incident resolved.';
  }

  return errors;
}

export function validateFilters(query) {
  const errors = {};
  if (query.q != null && typeof query.q !== 'string') {
    errors.q = 'Search text must be plain text.';
  } else if (text(query.q).length > SEARCH_MAX) {
    errors.q = 'Search text must be 120 characters or fewer.';
  }
  if (query.status && !STATUSES.includes(query.status)) {
    errors.status = 'Choose a status of Open, In Progress, or Resolved.';
  }
  if (query.severity && !SEVERITIES.includes(query.severity)) {
    errors.severity = 'Choose a severity.';
  }
  if (query.category && !CATEGORIES.includes(query.category)) {
    errors.category = 'Choose an issue category.';
  }
  if (query.production_line && !LINES.some((line) => line.name === query.production_line)) {
    errors.production_line = 'Choose a production line.';
  }
  return errors;
}

export function parsePositiveId(value) {
  const raw = typeof value === 'number' ? String(value) : value;
  if (typeof raw !== 'string' || !/^[1-9]\d{0,14}$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) return null;
  return id;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}
