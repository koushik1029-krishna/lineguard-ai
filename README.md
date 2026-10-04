# LineGuard AI

LineGuard is a local incident log for Northline Fabrication, a fictional mid-sized manufacturer of stainless process skids. Production operators record equipment faults and quality problems. Maintenance technicians, quality engineers, and supervisors can search those records, read similar resolved incidents, and request troubleshooting that uses approved sample maintenance documents.

The browser never receives an API key. Troubleshooting requests go to the Express API. If `OPENAI_API_KEY` is empty, the panel stays in **Demo mode** and does not present a fixed write-up as a live AI answer.

## Requirements

- Node.js 22.13 or newer (this project uses the built-in `node:sqlite` module)
- npm 10 or newer

Check the versions:

```powershell
node -v
npm -v
```

## Installation

From the project folder:

```powershell
cd C:\Users\koush\Music\lineguard-ai
Copy-Item .env.example .env
npm install
```

`npm install` installs the root tool that runs both apps, plus the Express server and React client workspaces.

`.env` is ignored by git. Leave `OPENAI_API_KEY` blank unless you want live troubleshooting.

## Database

LineGuard stores data in a SQLite file. You do not install a separate database server.

- The file is created at `server/data/lineguard.db` the first time the API starts.
- `server/src/db/schema.sql` creates the `incidents` and `documents` tables.
- If the incidents table is empty, startup loads the fictional sample incidents and approved maintenance documents.
- Reset the file and load the sample data again with:

```powershell
npm run seed
```

That command deletes the current rows and inserts the sample set. It prints the database path when it finishes.

## Start the app

```powershell
npm run dev
```

This starts both processes:

- API: http://localhost:3001
- Web app: http://localhost:5173

Open the web app at **http://localhost:5173**. The page talks to `/api`, and Vite forwards those requests to the API.

Stop the app with Ctrl+C in that terminal.

To run only the API:

```powershell
npm start
```

## Production

`npm run build` writes the React app to `client/dist`. `npm start` then serves that build and the API on the same port (`PORT`, default 3001). Refreshing a route such as `/incidents` still loads the app. The container and App Runner settings in this repo use port 8080.

## Tests

```powershell
npm test
```

The tests use an in-memory SQLite database. They do not read or change `server/data/lineguard.db`. They cover validation, search, resolution notes, similar incidents, and demo-mode troubleshooting. The demo-mode test expects `answer` to be `null` and checks that a placeholder API key is not treated as a live model.

## Live troubleshooting

1. Put a real key in `.env`:

   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

2. Restart `npm run dev`.
3. Open an incident and choose **Ask for troubleshooting help**.

The server selects matching approved documents and sends them with the incident text. The panel labels a real reply **Live AI response**. If the model call fails, the panel shows an error and does not substitute a canned answer.

A value such as `your-api-key-here` is treated as missing, so the panel stays in demo mode.

## Project layout

```
client/src/components   React pages and panels
client/src/api.js       Browser calls to /api only
server/src/routes       HTTP routes
server/src/services     Validation, search, similarity, and AI
server/src/db           SQLite connection, schema, and seed
server/src/data         Fictional incidents and maintenance documents
server/tests            API tests
```

## What to try

- Dashboard counts and recent incidents.
- Report an incident with the form blank to see validation messages, then submit a complete report.
- Search the incident list. A term such as `zzzz-no-match` shows the empty state.
- Open a Haas VF-4 mill incident to see a similar resolved record.
- On that incident, ask for troubleshooting help and confirm the demo-mode label. Expand a source document to read the stored procedure. That text is the maintenance document, not an AI answer.
