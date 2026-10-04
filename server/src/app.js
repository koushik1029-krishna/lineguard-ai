import cors from 'cors';
import express from 'express';
import { CATEGORIES, LINES, SEVERITIES, STATUSES } from './constants.js';
import { createAssistantRouter } from './routes/assistant.js';
import { createDocumentRouter } from './routes/documents.js';
import { createIncidentRouter } from './routes/incidents.js';
import { dashboard } from './services/incidents.js';

export function createApp(db, options = {}) {
  const env = options.env ?? process.env;
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'lineguard-api' });
  });

  app.get('/api/options', (req, res) => {
    res.json({
      lines: LINES,
      categories: CATEGORIES,
      severities: SEVERITIES,
      statuses: STATUSES,
    });
  });

  app.get('/api/dashboard', (req, res) => {
    res.json(dashboard(db));
  });

  app.use('/api/incidents', createIncidentRouter(db));
  app.use('/api/documents', createDocumentRouter(db));
  app.use('/api/assistant', createAssistantRouter(db, env));

  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'That API route does not exist.' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Request body must be valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Request body is too large.' });
    }
    console.error(error);
    return res.status(500).json({
      message: 'Something went wrong on the server. Try again in a moment.',
    });
  });

  return app;
}
