import { Router } from 'express';
import { assistantStatus, troubleshootIncident } from '../services/ai.js';
import { listAllDocuments } from '../services/documents.js';
import { getIncident } from '../services/incidents.js';
import { selectDocuments } from '../services/similarity.js';
import { parsePositiveId } from '../services/validation.js';

export function createAssistantRouter(db, env = process.env) {
  const router = Router();

  router.get('/status', (req, res) => {
    res.json(assistantStatus(env));
  });

  router.post('/troubleshoot', async (req, res, next) => {
    try {
      const id = parsePositiveId(req.body?.incident_id);
      if (id == null) {
        return res.status(400).json({ message: 'Choose an incident before asking for troubleshooting.' });
      }

      const incident = getIncident(db, id);
      if (!incident) {
        return res.status(404).json({ message: 'No incident exists with that id.' });
      }

      const documents = selectDocuments(incident, listAllDocuments(db));
      const result = await troubleshootIncident(env, incident, documents);
      return res.status(result.ok ? 200 : result.status).json(result.body);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
