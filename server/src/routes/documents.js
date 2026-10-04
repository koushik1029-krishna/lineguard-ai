import { Router } from 'express';
import { listApprovedDocuments } from '../services/documents.js';

export function createDocumentRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ documents: listApprovedDocuments(db) });
  });

  return router;
}
