import { Router } from 'express';
import { allIncidents, createIncident, getIncident, listIncidents, updateIncident } from '../services/incidents.js';
import { parsePositiveId } from '../services/validation.js';
import { findSimilar } from '../services/similarity.js';

export function createIncidentRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const result = listIncidents(db, req.query);
    if (result.error === 'validation') {
      return res.status(400).json({ message: 'Those filters are not valid.', errors: result.errors });
    }
    return res.json({ incidents: result.incidents, total: result.total });
  });

  router.post('/', (req, res) => {
    const result = createIncident(db, req.body || {});
    if (result.error === 'validation') {
      return res.status(400).json({
        message: 'Check the highlighted fields.',
        errors: result.errors,
      });
    }
    return res.status(201).json({ incident: result.incident });
  });

  router.get('/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id == null) {
      return res.status(400).json({ message: 'Incident id must be a whole number.' });
    }
    const incident = getIncident(db, id);
    if (!incident) {
      return res.status(404).json({ message: 'No incident exists with that id.' });
    }
    return res.json({ incident });
  });

  router.get('/:id/similar', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id == null) {
      return res.status(400).json({ message: 'Incident id must be a whole number.' });
    }
    const incident = getIncident(db, id);
    if (!incident) {
      return res.status(404).json({ message: 'No incident exists with that id.' });
    }
    const results = findSimilar(incident, allIncidents(db));
    return res.json({ results });
  });

  router.patch('/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id == null) {
      return res.status(400).json({ message: 'Incident id must be a whole number.' });
    }
    const result = updateIncident(db, id, req.body || {});
    if (result.error === 'not_found') {
      return res.status(404).json({ message: 'No incident exists with that id.' });
    }
    if (result.error === 'validation') {
      return res.status(400).json({
        message: 'Check the highlighted fields.',
        errors: result.errors,
      });
    }
    return res.json({ incident: result.incident });
  });

  return router;
}
