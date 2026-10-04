const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 2000;
const NOTES_MIN = 15;

export function validateIncident(form, lines) {
  const errors = {};
  const line = form.production_line.trim();
  const equipment = form.equipment.trim();
  const description = form.description.trim();
  const reportedBy = form.reported_by.trim();
  const selectedLine = lines?.find((item) => item.name === line);

  if (!line) errors.production_line = 'Choose a production line.';
  if (!equipment) {
    errors.equipment = 'Choose the equipment that failed.';
  } else if (selectedLine && !selectedLine.equipment.includes(equipment)) {
    errors.equipment = 'Choose equipment that belongs to the selected production line.';
  }
  if (!form.category) errors.category = 'Choose an issue category.';
  if (!form.severity) errors.severity = 'Choose a severity.';

  if (!description) {
    errors.description = 'Describe what happened.';
  } else if (description.length < DESCRIPTION_MIN) {
    errors.description = 'Describe what happened in at least 20 characters.';
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }

  if (!reportedBy || reportedBy.length < 2) {
    errors.reported_by = 'Enter your name so technicians know who reported this.';
  } else if (reportedBy.length > 80) {
    errors.reported_by = 'Name must be 80 characters or fewer.';
  } else if (!/\p{L}/u.test(reportedBy)) {
    errors.reported_by = 'Enter the name of the person reporting this incident.';
  }

  if (!form.occurred_at) {
    errors.occurred_at = 'Enter when the incident happened.';
  } else {
    const when = new Date(form.occurred_at);
    if (Number.isNaN(when.getTime())) {
      errors.occurred_at = 'Enter a valid date and time.';
    } else if (when.getTime() > Date.now() + 2 * 60 * 1000) {
      errors.occurred_at = 'That time is in the future. Use the time the fault was observed.';
    }
  }

  return errors;
}

export function validateResolution(form) {
  const errors = {};
  if (!['Open', 'In Progress', 'Resolved'].includes(form.status)) {
    errors.status = 'Choose a status of Open, In Progress, or Resolved.';
  }
  const notes = form.resolution_notes.trim();
  if (notes.length > DESCRIPTION_MAX) {
    errors.resolution_notes = 'Resolution notes must be 2000 characters or fewer.';
  }
  if (form.status === 'Resolved' && notes.length < NOTES_MIN) {
    errors.resolution_notes =
      'Add resolution notes of at least 15 characters before marking this incident resolved.';
  }
  return errors;
}

export function toDatetimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
