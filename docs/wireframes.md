# Marine Managed — Wireframes & Spec (v0)

Goal: one source of truth for the boat. A web app to record what the boat is and
everything that happens to it, plus an MCP server so Claude can read that context
and write findings back.

Single-user, single-boat to start. Multi-boat is a later concern, but every entity
hangs off a `boat_id` so it stays cheap to add.

---

## 1. Entities

```
Boat
  name, make, model, year, length_ft, beam_ft, hull_type, hull_material
  hin, registration_no, registration_expires, home_port
  purchase_date, purchase_price, notes
  photos[], documents[]

Engine (1..n per boat)
  make, model, year, serial, hp, fuel_type, drive_type (outboard/inboard/sterndrive/jet)
  current_hours, hours_updated_at
  prop (material, pitch, diameter), gear_ratio
  notes

System (component inventory; free-form)
  category (electrical/plumbing/fuel/steering/electronics/canvas/safety/other)
  name, make, model, serial, installed_on, notes
  e.g. "House battery bank", "Garmin 943xsv", "Bilge pump (aft)"

Trailer
  make, model, year, vin, axles, capacity_lbs, tire_size, tire_pressure
  brake_type, registration_no, registration_expires
  last_bearing_service, notes, photos[]

ServiceEntry
  date, kind (maintenance/repair/upgrade/inspection/winterize/commission)
  target (boat|engine|trailer|system → id)
  title, description, performed_by (DIY|shop name), shop_contact
  engine_hours_at, parts[] (name, part_no, qty, cost), labor_cost, total_cost
  resolves_issue_id?, attachments[], source (manual|mcp)

Issue
  title, status (open/monitoring/scheduled/resolved/wont_fix)
  severity (low/med/high/safety), target (same as above)
  first_noticed, symptoms, suspected_cause, est_cost
  notes[] (timestamped, author = user|claude), linked_service_entries[]
  resolved_on, resolution

InsurancePolicy (boat or trailer)
  covers (boat|trailer), carrier, policy_no, agent_contact
  coverage_summary, hull_value, liability_limit, deductible
  premium, billing_period, starts, renews, documents[]

Storage
  kind (slip/mooring/dry_stack/yard/driveway/garage), location_name, address
  contact, cost, billing_period, season_start, season_end, notes

CostEntry (ledger; most are auto-derived from the above)
  date, category (service/parts/fuel/insurance/storage/registration/upgrade/other)
  amount, vendor, note, linked_to (service_entry|policy|storage|manual)

Document
  title, kind (manual/receipt/photo/policy/registration/other)
  file, text_extract (for MCP search), attached_to (any entity)

ApiKey (for MCP)
  label, hashed_key, created, last_used, scopes (read|read_write)

ActivityLog
  when, actor (user|claude), action, entity, diff_summary
```

---

## 2. Screens

Left nav, persistent: **Overview · Boat · Engines · Systems · Trailer · Service ·
Issues · Insurance · Storage · Costs · Documents · Settings**

### 2.1 Overview (home)
```
┌───────────────────────────────────────────────────────────────┐
│ [photo]  "Salty Dog"  2019 Boston Whaler 230 Outrage           │
│          Yamaha F300 · 412 hrs · HIN BWCE1234A919                │
├───────────────┬───────────────┬───────────────┬───────────────┤
│ Open issues   │ Next service  │ YTD spend     │ Renewals      │
│   3  (1 high) │ 100hr in 12h  │ $4,120        │ Ins. in 41d   │
├───────────────┴───────────────┴───────────────┴───────────────┤
│ Open issues (top 5)              │ Recent activity              │
│ ▲ Bilge pump cycling   high      │ 10/28 Claude added note →    │
│ ● Trim gauge erratic   med       │ 10/26 Service: oil change    │
│ ● Canvas zipper        low       │ 10/20 Issue opened: trim     │
├──────────────────────────────────┴──────────────────────────────┤
│ Upcoming: 100hr service · Trailer bearings (Apr) · Reg. expires │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Boat profile
Form + read view. Sections: Identity · Dimensions · Registration · Purchase ·
Photos · Documents. "Edit" toggles inline editing. Engines and Systems are
separate tabs on the same page (or separate nav items; TBD).

### 2.3 Engines
Card per engine. Prominent **"Update hours"** control (this drives service
reminders). Service interval rules per engine (e.g. oil every 100h, impeller
every 200h / 2y) → feed "Next service" on Overview.

### 2.4 Systems
Table: category · name · make/model · installed · last service · open issues.
Click → detail with linked service entries and issues. This is the component
inventory Claude will lean on when troubleshooting.

### 2.5 Trailer
Same pattern as Boat profile. Fields above. Its own insurance + registration +
storage are shown here as summary cards linking to the main Insurance/Storage pages.

### 2.6 Service log
```
[+ New entry]   Filter: kind ▾  target ▾  year ▾  performed-by ▾   🔍
──────────────────────────────────────────────────────────────────
 Date     Kind         Target        Title                  By     Cost
 10/26    maintenance  Yamaha F300   Oil + filter, 400h     DIY    $86
 09/14    repair       Bilge (aft)   Replaced float switch  DIY    $42
 05/02    commission   Boat          Spring commissioning   Marina $1,240
```
Row click → detail drawer: description, parts list, attachments, engine hours,
linked issue, "added via MCP" badge if source=mcp.

New-entry form is the most-used form in the app; keep it fast: date defaults to
today, engine hours prefilled from engine, parts list is add-row.

### 2.7 Issues
Board view (Open · Monitoring · Scheduled · Resolved) with list toggle.
Card: title, target, severity chip, age, note count, 🤖 if Claude has contributed.

Issue detail:
```
┌ Bilge pump cycling every ~4 min          [high]  [Open ▾] ┐
│ Target: Bilge pump (aft)   First noticed: 10/18            │
│ Symptoms: ...                                              │
│ Suspected cause: ...                Est. cost: $60–200     │
├────────────────────────────────────────────────────────────┤
│ Notes / diagnosis thread                                   │
│  10/18 you     Noticed after rain...                        │
│  10/28 claude  Checked service log: float switch replaced   │
│                9/14. Suggest check-valve or hose siphon...  │
│  [ add note ]                                              │
├────────────────────────────────────────────────────────────┤
│ Linked service entries        [Log service that resolves]  │
└────────────────────────────────────────────────────────────┘
```

### 2.8 Insurance
List of policies (boat, trailer). Card: carrier, policy #, renews-in, premium,
coverage summary, documents. Renewal within 60d surfaces on Overview.

### 2.9 Storage
Current arrangement + history. Seasonal (summer slip / winter yard) is common,
so support multiple records with date ranges. Trailer storage is a record with
target=trailer.

### 2.10 Costs
Totals: YTD · lifetime · by category · by year. Simple bar chart by month and a
category breakdown. Ledger table below with filters. Most rows auto-created from
service/insurance/storage; manual rows for fuel etc.

### 2.11 Documents
Grid with kind filter. Upload → optional text extraction so manuals are
searchable by Claude. Attach to any entity.

### 2.12 Settings → Claude / MCP
- Generate API key (label, read-only vs read-write). Show once.
- Connection snippet for claude.ai custom connector (URL + key).
- Activity log: every MCP read/write, with diff. "Undo" on writes.
- Toggle: require confirmation for MCP writes (writes land as "pending" until
  approved in the UI).

---

## 3. MCP server

Transport: Streamable HTTP, bearer API key. Lives alongside the app
(`/mcp` route) so there is one deploy.

Tools (names tentative):

| Tool | Mode | Purpose |
|---|---|---|
| `get_boat_context` | read | One-shot condensed summary: boat, engines, systems, open issues, last ~10 service entries, renewals. The "load everything" call. |
| `get_boat_profile` | read | Full boat + engines + systems |
| `get_trailer_profile` | read | |
| `list_service_entries` | read | filters: target, kind, since, query |
| `get_service_entry` | read | |
| `list_issues` | read | filter: status, target, severity |
| `get_issue` | read | includes full notes thread |
| `get_insurance` / `get_storage` | read | |
| `get_cost_summary` | read | period, group_by |
| `search` | read | full-text across everything incl. document extracts |
| `get_document` | read | text extract of a manual/receipt |
| `add_service_entry` | write | source=mcp |
| `create_issue` | write | |
| `add_issue_note` | write | author=claude. Primary write path for troubleshooting. |
| `update_issue` | write | status, severity, suspected_cause, est_cost |
| `update_engine_hours` | write | |
| `add_cost_entry` | write | |

Resources: `boat://profile`, `boat://issues/open`, `boat://service/recent` for
clients that prefer resources over tools.

Every write is logged to ActivityLog and (optionally) held as pending.

---

## 4. Suggested stack (not decided)

- Next.js (app router) + TypeScript, single deploy
- SQLite via Drizzle locally; Postgres (Neon/Supabase) when hosted
- Auth: single-user password or magic link; MCP uses API keys
- MCP: `@modelcontextprotocol/sdk` server mounted at `/mcp`
- File storage: local disk → S3-compatible later

---

## 5. Open questions

1. Hosted (so claude.ai can reach the MCP) vs local + tunnel? Hosted is
   required for claude.ai custom connectors; local-only works with Claude Desktop.
2. Should MCP writes require in-app approval by default?
3. Multi-boat from day one, or later?
4. Engine-hour-based reminders: fixed intervals per engine, or a generic
   "maintenance schedule" entity?
