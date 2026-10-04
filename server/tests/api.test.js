import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db/connection.js';
import { resetSeed } from '../src/db/seed.js';

const demoEnv = { OPENAI_API_KEY: '' };

async function withApp(env, fn) {
  const db = openDatabase(':memory:');
  resetSeed(db);
  const app = createApp(db, { env });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base, db);
  } finally {
    server.closeAllConnections?.();
    server.close();
    await once(server, 'close');
    db.close();
  }
}

async function readJson(response) {
  return response.json();
}

test('health check responds', async () => {
  await withApp(demoEnv, async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.ok, true);
  });
});

test('seed data is searchable and documents are approved', async () => {
  await withApp(demoEnv, async (base) => {
    const incidents = await readJson(await fetch(`${base}/api/incidents?q=porosity`));
    assert.ok(incidents.incidents.length >= 2);
    assert.ok(incidents.total >= 16);

    const documents = await readJson(await fetch(`${base}/api/documents`));
    assert.ok(documents.documents.length >= 8);
    assert.ok(documents.documents.every((document) => document.approved === 1));

    const dashboard = await readJson(await fetch(`${base}/api/dashboard`));
    assert.equal(dashboard.counts.total, incidents.total);
    assert.ok(dashboard.recent.length > 0);
  });
});

test('incident form rejects a short description', async () => {
  await withApp(demoEnv, async (base) => {
    const response = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        production_line: 'Machine Shop',
        equipment: 'Haas VF-4 mill',
        category: 'Mechanical',
        severity: 'Low',
        description: 'Too short',
        occurred_at: '2026-09-20T12:00:00.000Z',
        reported_by: 'Priya Raman',
      }),
    });
    assert.equal(response.status, 400);
    const body = await readJson(response);
    assert.match(body.errors.description, /at least 20 characters/);
  });
});

test('a new incident is stored as open even if status is sent', async () => {
  await withApp(demoEnv, async (base) => {
    const response = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        production_line: 'Finish & Pack',
        equipment: 'Pack-out scale SC-4',
        category: 'Electrical',
        severity: 'Low',
        status: 'Resolved',
        description: 'The scale display blanks out when the conveyor starts beside the station.',
        occurred_at: '2026-09-20T12:00:00.000Z',
        reported_by: 'James Okonkwo',
      }),
    });
    assert.equal(response.status, 201);
    const body = await readJson(response);
    assert.equal(body.incident.status, 'Open');
    assert.equal(body.incident.resolution_notes, null);

    const stored = await readJson(await fetch(`${base}/api/incidents/${body.incident.id}`));
    assert.equal(stored.incident.equipment, 'Pack-out scale SC-4');
  });
});

test('resolving an incident requires notes', async () => {
  await withApp(demoEnv, async (base) => {
    const list = await readJson(await fetch(`${base}/api/incidents?q=spindle%20load`));
    const openIncident = list.incidents.find((incident) => incident.status === 'Open');
    assert.ok(openIncident);

    const rejected = await fetch(`${base}/api/incidents/${openIncident.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved', resolution_notes: 'Fixed' }),
    });
    assert.equal(rejected.status, 400);
    const rejectedBody = await readJson(rejected);
    assert.match(rejectedBody.errors.resolution_notes, /at least 15 characters/);

    const saved = await fetch(`${base}/api/incidents/${openIncident.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Resolved',
        resolution_notes: 'Cleared the nozzle and confirmed the coolant reading was back in range.',
      }),
    });
    assert.equal(saved.status, 200);
    const savedBody = await readJson(saved);
    assert.equal(savedBody.incident.status, 'Resolved');
    assert.ok(savedBody.incident.resolved_at);
  });
});

test('similar incidents stay inside stored records and skip the current one', async () => {
  await withApp(demoEnv, async (base) => {
    const list = await readJson(await fetch(`${base}/api/incidents?q=spindle`));
    const source = list.incidents[0];
    const body = await readJson(await fetch(`${base}/api/incidents/${source.id}/similar`));
    assert.ok(body.results.length >= 1);
    assert.ok(body.results.every((result) => result.incident.id !== source.id));
    assert.ok(body.results.some((result) => result.incident.equipment === 'Haas VF-4 mill'));
    assert.ok(body.results.every((result) => result.score >= 40 && result.score <= 100));
    assert.ok(body.results[0].reasons.length > 0);
  });
});

test('troubleshooting without a key is labeled demo mode and has no answer', async () => {
  await withApp({ OPENAI_API_KEY: 'your-api-key-here' }, async (base, db) => {
    db.prepare(
      `
      INSERT INTO documents (document_code, title, equipment, category, doc_type, body, approved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `,
    ).run(
      'DRAFT-999',
      'Unapproved spindle note',
      'Haas VF-4 mill',
      'Mechanical',
      'Draft',
      'UNIQUE_UNAPPROVED_PHRASE should never be sent as context.',
    );

    const status = await readJson(await fetch(`${base}/api/assistant/status`));
    assert.equal(status.mode, 'demo');
    assert.equal(status.label, 'Demo mode');

    const list = await readJson(await fetch(`${base}/api/incidents?equipment=`));
    const incident = list.incidents.find((item) => item.equipment === 'Haas VF-4 mill');
    const response = await fetch(`${base}/api/assistant/troubleshoot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incident.id }),
    });
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.mode, 'demo');
    assert.equal(body.answer, null);
    assert.match(body.message, /Demo mode/);
    assert.match(body.message, /did not call a language model/);
    assert.ok(body.documents.length >= 1);
    assert.ok(body.documents.some((document) => document.document_code === 'TG-MS-008'));
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes('UNIQUE_UNAPPROVED_PHRASE'), false);
    assert.equal(serialized.includes('your-api-key-here'), false);
  });
});

test('missing incidents return a not found message', async () => {
  await withApp(demoEnv, async (base) => {
    const response = await fetch(`${base}/api/incidents/99999`);
    assert.equal(response.status, 404);
    const body = await readJson(response);
    assert.match(body.message, /No incident exists/);
  });
});

const validIncident = {
  production_line: 'Machine Shop',
  equipment: 'Haas VF-4 mill',
  category: 'Mechanical',
  severity: 'Low',
  description: 'Coolant flow dropped during a facing pass and the operator stopped the cycle.',
  occurred_at: '2026-09-20T12:00:00.000Z',
  reported_by: 'Priya Raman',
};

test('empty, invalid, and oversized incident fields are rejected', async () => {
  await withApp(demoEnv, async (base) => {
    const empty = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(empty.status, 400);

    const unknownLine = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, production_line: 'Not a line' }),
    });
    assert.equal(unknownLine.status, 400);
    const unknownBody = await readJson(unknownLine);
    assert.match(unknownBody.errors.production_line, /production line/);

    const longDescription = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validIncident, description: 'a'.repeat(2001) }),
    });
    assert.equal(longDescription.status, 400);
    const longBody = await readJson(longDescription);
    assert.match(longBody.errors.description, /2000/);

    const badId = await fetch(`${base}/api/incidents/abc`);
    assert.equal(badId.status, 400);
    const zeroId = await fetch(`${base}/api/incidents/0`);
    assert.equal(zeroId.status, 400);
    const hugeId = await fetch(`${base}/api/incidents/${'9'.repeat(20)}`);
    assert.equal(hugeId.status, 400);
  });
});

test('search treats wildcards as text and limits query length', async () => {
  await withApp(demoEnv, async (base) => {
    const wildcard = await readJson(await fetch(`${base}/api/incidents?q=${encodeURIComponent('%')}`));
    assert.equal(wildcard.incidents.length, 0);

    const injected = await readJson(
      await fetch(`${base}/api/incidents?q=${encodeURIComponent("' OR 1=1 --")}`),
    );
    assert.equal(injected.incidents.length, 0);

    const tooLong = await fetch(`${base}/api/incidents?q=${'a'.repeat(121)}`);
    assert.equal(tooLong.status, 400);
    const tooLongBody = await readJson(tooLong);
    assert.match(tooLongBody.errors.q, /120/);

    const normal = await readJson(await fetch(`${base}/api/incidents?q=porosity`));
    assert.ok(normal.incidents.length >= 2);
  });
});

test('a status update does not erase notes or other incident fields', async () => {
  await withApp(demoEnv, async (base) => {
    const created = await readJson(
      await fetch(`${base}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validIncident),
      }),
    );
    const id = created.incident.id;
    const noted = await readJson(
      await fetch(`${base}/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'In Progress',
          resolution_notes: 'Replaced the coolant hose and ran a dry cycle.',
          reported_by: 'Someone Else',
          description: 'This should not replace the original write-up.',
        }),
      }),
    );
    assert.equal(noted.incident.reported_by, 'Priya Raman');
    assert.match(noted.incident.description, /Coolant flow dropped/);

    const reopened = await readJson(
      await fetch(`${base}/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Open' }),
      }),
    );
    assert.equal(reopened.incident.status, 'Open');
    assert.match(reopened.incident.resolution_notes, /coolant hose/);

    const badNotes = await fetch(`${base}/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Progress', resolution_notes: { wiped: true } }),
    });
    assert.equal(badNotes.status, 400);
    const stillThere = await readJson(await fetch(`${base}/api/incidents/${id}`));
    assert.match(stillThere.incident.resolution_notes, /coolant hose/);
  });
});

test('malformed and oversized bodies return safe errors', async () => {
  await withApp(demoEnv, async (base) => {
    const malformed = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(malformed.status, 400);
    const malformedBody = await readJson(malformed);
    assert.match(malformedBody.message, /valid JSON/);
    assert.equal(JSON.stringify(malformedBody).includes('SyntaxError'), false);

    const oversized = await fetch(`${base}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'x'.repeat(1_100_000) }),
    });
    assert.equal(oversized.status, 413);
    const oversizedBody = await readJson(oversized);
    assert.match(oversizedBody.message, /too large/);
  });
});

test('troubleshooting rejects coerced ids and does not expose a key', async () => {
  await withApp({ OPENAI_API_KEY: 'sk-test-secret-value' }, async (base) => {
    const status = await readJson(await fetch(`${base}/api/assistant/status`));
    assert.deepEqual(Object.keys(status).sort(), ['label', 'mode', 'model']);
    assert.equal(JSON.stringify(status).includes('sk-test-secret-value'), false);

    for (const incidentId of [true, '1e2', '0', -3]) {
      const response = await fetch(`${base}/api/assistant/troubleshoot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId }),
      });
      assert.equal(response.status, 400);
    }
  });
});

test('browser origins outside the local app are not allowed', async () => {
  await withApp(demoEnv, async (base) => {
    const blocked = await fetch(`${base}/api/health`, {
      headers: { Origin: 'https://example.invalid' },
    });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);

    const allowed = await fetch(`${base}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});

test('requests succeed without credentials because the local API has no accounts', async () => {
  await withApp(demoEnv, async (base) => {
    const response = await fetch(`${base}/api/dashboard`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('www-authenticate'), null);
  });
});
