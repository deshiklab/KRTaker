# SA1-fullsite-v10 — Table Toolkit (v3.64 / SW v71, 2026-08-12)

User: "Add pagination and advanced filter options in each table view of Super Admin Panel.
And then continue to next tasks (CNAME verify → Theming v2)." This ref = the table
toolkit part, shipped as **v3.64 / SW v71** (panel build + web cache-bust bump).

## What it does
A reusable client-side table toolkit (`tbl*` functions) gives EVERY panel table view a
toolbar (free-text search + per-column dropdown filters + clear) + sortable column
headers (⇅/▲/▼) + pagination (‹ pages › with ellipsis, page-size 10/25/50/100,
"1–10 of N" count). Applied to 18 tables across 16 views: Dashboard recent
subscribers, Subscribers, Users, Providers, Packages, Blog, Onboarding (3 tables),
MIS ledger, Payments integrations, Finance ledger, Integrations, Tickets, Backup
snapshots, Modules coverage, Webhooks, Audit, Tenant Keys, API usage recent, AI chat
telemetry, API Data drawer.

## Toolkit (superadmin.html, before renderSubscribers)
- **State**: `TBLK[key]={q,f:{},p,ps,s,dir}` (per-view; persists across nav);
  `TBLREG[key]=cfg` for re-render dispatch.
- **tblApply(k,data,cfg)** — clone → search (cfg.search cols, case-insensitive) →
  per-filter exact match → sort (numeric-aware, dir ±1) → paginate; clamps p.
- **tblBar(k,cfg)** — toolbar HTML: search input (`tblQ-<k>`, oninput → tblSetQ, body
  only so focus is kept), filter selects (options from `tblUniq` OR explicit
  `[{v,l}]` list for friendly labels e.g. active 0/1 → Active/Suspended), Clear (n)
  button, count span `tblCount-<k>`.
- **tblTh(k,label,col,st)** — sortable `<th>` with ⇅/▲/▼; non-sortable th when col
  falsy. **tblPanel(k,cfg)** — panel shell with `tblHead-<k>`/`tblBody-<k>`/`tblPager-<k>`
  containers. **tblDraw(k,cfg)** — fills head/body/pager/count from state.
- Handlers: tblSetQ / tblSetF (re-renders bar via outerHTML to refresh Clear+count,
  then body) / tblClear (wipes TBLK, resets input+selects) / tblGo / tblSetPs /
  tblSort (toggle dir). Each view calls `tblReg(k,cfg)` then `load(...tblPanel(k,cfg))`
  then `tblDraw(k,cfg)`.

## Per-view cfg shape
`{data, ph, search:[cols], filters:[[col,label] | [col,label,opts]], sortable:[cols],
head:st=>`<tr>…tblTh…</tr>`, row:r=>`<tr>…</tr>`, empty:'<tr><td colspan=N>…'}`.
Filters with explicit opts: `[['active','Status',[{v:'1',l:'Active'},{v:'0',l:'Suspended'}]]]`.

## Pitfalls / class-notes
- **PHP built-in server docroot fallback**: bare endpoints like `/sitemap` (no `/api/`
  prefix) fall through the router to `/tmp/krtest/index.php` — a STALE copy of the API
  left in the rig docroot. It crashed on `cms_content.updated_at` (column dropped).
  Fix: `cp /root/krtaker-deploy/api/index.php /tmp/krtest/index.php` after API syncs.
- **Search input must not lose focus**: tblSetQ only re-renders body/pager/count, never
  the toolbar. Filter changes (select onchange) may re-render the bar (outerHTML) since
  focus is already off the input.
- Emoji in innerText breaks browser_console JSON serialization — strip non-ASCII
  before returning E2E snapshots.
- Version guards in tests: SW v70→v71 (`krtaker-site-v71`), `?v=3.63`→`3.64` on 11 web
  pages; cleanup sets admin_settings version/sw_version to v3.64/v70.

## Verify
- test_superadmin **397/397** (373 + 24 new: toolkit fns defined, TBLK/TBLREG globals,
  18 tblPanel call sites, subscriber filter config, sortable th wiring).
- Full run_all **2561/2561** (48 suites; stale `/tmp/krtest/index.php` replaced first).
- Live browser E2E: Dashboard widget (Plan/Status filters, 6 rows) → Subscribers
  (15 rows → 10/pg, pager 1|2, search "Belal" → 3 rows + pager hidden, status filter →
  2 rows + Clear(1), sort by name, page 2 → 5 rows "11–15 of 15") → Audit (200 rows →
  20 pages, module/user filters) → Users (role/active) → Tenant Keys (0 rows empty
  state, active/plan filters) → Webhooks (active filter) → **0 JS errors** · live DB
  untouched (read-only E2E).
