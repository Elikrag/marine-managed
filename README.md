# Marine Managed

One source of truth for your boat.

Fill out a profile for the boat (and trailer), then track everything that happens to it:
service and repair history, known issues, insurance, storage, costs, and documents.
An MCP server exposes all of it to Claude, so you can troubleshoot a new problem with the
full history in context and have Claude write its findings back as notes on the issue.

Theme: orca. Black, white, and cold deep-water teal. Light and dark follow your system.

## Stack

- Next.js 16 (app router, server actions), TypeScript, Tailwind 4
- SQLite via libsql + Drizzle. A local file in dev; the same file on a volume, or Turso, when hosted
- `@modelcontextprotocol/sdk` server mounted at `/mcp` (Streamable HTTP, stateless)
- Single-user password login for the UI; hashed API keys for MCP

## Run it locally

```bash
cp .env.example .env     # set APP_PASSWORD and SESSION_SECRET
npm install
npm run db:push          # create tables in data/marine.db
npm run db:seed          # optional: sample boat so there is something to look at
npm run dev
```

Open http://localhost:3000, sign in with `APP_PASSWORD`, and either edit the seeded boat or
start fresh: stop the dev server, delete `data/marine.db`, run `npm run db:push`, start it
again. The server holds the DB file open, so it must be restarted after deleting the file.

## Connect Claude

1. Settings → Claude → Generate key (read + write).
2. Add the server to a Claude client:

   | Client | How |
   |---|---|
   | claude.ai | Settings → Connectors → Add custom connector. URL `https://<host>/mcp/<key>` (claude.ai cannot send a custom header, so the key goes in the path). |
   | Claude Desktop / Code | `claude mcp add --transport http marine https://<host>/mcp --header "Authorization: Bearer <key>"` |

3. Ask Claude something like "what's going on with my boat?". It calls `get_boat_context` first,
   then digs into service history, issues, and document text as needed.

By default Claude's writes (`add_issue_note`, `create_issue`, `add_service_entry`,
`update_issue`, `update_engine_hours`, `add_cost_entry`) are **held for your approval** under
Settings → Claude. Reads are never held. Turn the hold off there if you trust it.

Every MCP call is logged on the Settings page with the actor, tool, and a summary.

### Tools

| Tool | Mode | What it does |
|---|---|---|
| `get_boat_context` | read | One-shot summary: boat, engines + hours + service due, systems, trailer, open issues, recent service, insurance, storage, cost totals |
| `get_boat_profile`, `get_trailer_profile` | read | Full records as JSON |
| `list_service_entries`, `get_service_entry` | read | Filter by kind, target, year, text, since |
| `list_issues`, `get_issue` | read | Issue with its full notes thread |
| `get_insurance`, `get_storage`, `get_cost_summary` | read | |
| `search` | read | Full text across service, issues + notes, systems, document extracts |
| `list_documents`, `get_document` | read | Paged text of a manual or receipt |
| `add_issue_note` | write | The main troubleshooting write path, author = claude |
| `create_issue`, `update_issue` | write | |
| `add_service_entry`, `update_engine_hours`, `add_cost_entry` | write | |

Resource: `boat://context` (same text as `get_boat_context`).

## Host it

claude.ai needs a public HTTPS URL. The app wants a persistent disk for the SQLite file
and uploads, so a container host with a volume is the simplest fit.

### Fly.io

```bash
fly launch --no-deploy          # accept the generated app name, keep fly.toml
fly volumes create data --size 1
fly secrets set APP_PASSWORD=... SESSION_SECRET=$(openssl rand -hex 32) APP_URL=https://<app>.fly.dev
fly deploy
```

`fly.toml` mounts the volume at `/data`; `DATABASE_URL` and `UPLOAD_DIR` already point there.
Migrations run on start.

### Anywhere else

Any Node host works. Set `DATABASE_URL` (a `file:` path on a volume, or a `libsql://` Turso
URL plus `DATABASE_AUTH_TOKEN`), `UPLOAD_DIR` on persistent disk, and run `npm run db:migrate`
before `npm start`. On serverless hosts with no disk, use Turso for the DB and expect uploads
to need an object store (not wired up yet).

## Scripts

| | |
|---|---|
| `npm run db:push` | Sync schema to the DB (dev) |
| `npm run db:generate` | Write a SQL migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (prod) |
| `npm run db:seed` | Sample data, skipped if a boat exists |
| `npx tsx scripts/create-key.ts <label> [read\|read_write]` | Mint an MCP key from the CLI |

## Layout

```
src/app/(app)/*      authenticated pages, one folder per section, server actions in actions.ts
src/app/mcp          MCP endpoint
src/app/api/files    serves uploaded documents
src/lib/mcp.ts       tool definitions
src/lib/writes.ts    write operations shared by the UI and MCP
src/lib/data.ts      queries
src/db/schema.ts     Drizzle schema
docs/                wireframes and spec
```

## Status

v0. Single user, single boat. Multi-boat is a later concern; every table already carries a `boat_id`.
