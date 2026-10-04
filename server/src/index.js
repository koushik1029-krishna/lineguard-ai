import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { createApp } = await import('./app.js');
const { openDatabase, resolveDbPath } = await import('./db/connection.js');
const { seedIfEmpty } = await import('./db/seed.js');
const { assistantStatus } = await import('./services/ai.js');

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error('LineGuard requires Node.js 22.13 or newer for the built-in SQLite module.');
  process.exit(1);
}

const dbPath = resolveDbPath();
const db = openDatabase(dbPath);
const seeded = seedIfEmpty(db);
const app = createApp(db);
const clientDist = path.resolve(__dirname, '../../client/dist');
const clientIndex = path.join(clientDist, 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(clientIndex);
  });
}
const port = Number(process.env.PORT) || 3001;

const server = app.listen(port, '0.0.0.0', () => {
  const mode = assistantStatus();
  console.log(`LineGuard API listening on http://localhost:${port}`);
  console.log(`SQLite database: ${dbPath}`);
  console.log(
    mode.mode === 'live'
      ? `Troubleshooting: live AI using ${mode.model}.`
      : 'Troubleshooting: demo mode (no API key). The panel will not invent an AI answer.',
  );
  if (seeded) {
    console.log(
      `Database was empty. Seeded ${seeded.incidents} incidents and ${seeded.documents} maintenance documents.`,
    );
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other process or change PORT in .env.`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
