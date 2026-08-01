# KRTaker — Project Plan
**Key Responsibility Taker** — AI-Driven Autonomous Property Management Platform (Bangladesh SaaS)

Status: 🚀 Project start · Reference: REM ERP (design/code/styling) · Date: 2026-08-01
**Decisions:** AI provider = **DeepSeek** (Phase 5) · Repo = `kabirswe/KRTaker` (private; move to `deshiklab` when org access available)

## Phase Log
- **Phase 2 ✅ (2026-06-12)** — Dashboard backend + RBAC live on krtaker.com. `api/index.php` extended with app layer: SQLite app tables (properties/units/tenants/leases/invoices/receipts/payments/tickets/partners/staff/support/plan_catalog/app_users/app_tokens/audit_log), endpoints `app-setup`, `app-login`, `app-logout`, `app-me`, `app-bootstrap`, `app-subscribe`, `app-ticket-status`, `app-payment` (Bearer tokens, 7-day TTL, role-based module gating server-side). Registration now stores password_hash (plan stays `Trial` — chosen in dashboard). Dashboard V2 wired to live API: auth screen, role-isolated data (tenant sees only their leases/invoices), in-dashboard **subscription manager** (Starter/Business/Enterprise upgrade via `app-subscribe`, persists), demo-preview role switching with banner, logout. login.html now does real auth → dashboard. Demo accounts: owner@/sultana@/kabir@krtaker.com (demo123). Cache-bump v3.1 / SW v9.
- **V2.1 Dashboard (2026-06-12)** — `docs/dashboard-v2.html`: added global search (units/tenants/leases/invoices/receipts/payments/tickets/partners/staff/support, keyboard nav, jump-to-row highlight), mobile hamburger + backdrop, mobile search bar, bottom mob-bar now mobile-only (was leaking to desktop via inline style), desktop-only sticky footer (breadcrumb · zoom 60–150% · fullscreen · © credits). Live: krtaker.com/dashboard-v2.html.
- **V2 Dashboard (2026-06-12)** — `docs/dashboard-v2.html` (V1 kept as `docs/design-prototype.html`): completely redesigned dashboards for all 10 subscriber roles (Super Admin, Owner, Manager, Tenant, Partner, Service Manager/QC, Legal, CRM, Accountant, HR) in the landing-page design system (same tokens, fonts, dark mode, bilingual EN/বাংলা). Role switcher gates modules; all 12 module views; KR AI widget; pure-SVG charts; deployed live at krtaker.com/dashboard-v2.html.
- **Phase 1 ✅ (2026-08-01, commit `76b6dc7`)** — PWA prototype v1.0 (`docs/design-prototype.html`, SW `krtaker-v1-0`): 12 modules (Dashboard, Properties, Units, Tenants, Leases, Invoices, Receipts, Payments, Taxes, Maintenance, Compliance, AI Assistant); legal engines verified (TPA §107 registration gate, PRCA §10/§23 advance cap + §18 eviction, TDS split §109/§128, holding-tax Net Annual Value pipeline); bKash sandbox 4-step pay flow; AI caretaker chat with tool actions; zero JS errors, tunnel preview live.

---

## 1. Analysis of the Technical Documentation

The document describes an **enterprise-grade multi-tenant property management SaaS** for the Bangladesh market with an autonomous AI agent as the "digital caretaker". Five core domains:

| Domain | What it does | Key requirements from doc |
|---|---|---|
| **AI Orchestration Layer** | NLP chat + autonomous workflows | LLM + RAG over BD statutes (TPA 1882, PRCA 1991, Income Tax Act 2023), function-calling, permission-inherited tool execution |
| **CRM + Project Mgmt** | Tenant/lead pipeline, task & milestone tracking | Lead nurturing, sales forecasting, renovation project oversight |
| **Legal & Compliance Engine** | Programmatic enforcement of BD law | Lease >12mo → "Pending Registration" gate; PRCA rent-hike/advance/eviction constraints; e-Porcha/khatian verification |
| **Financial & Taxation Engine** | Rent, holding tax, TDS, capital gains | Net Annual Value formula, wealth surcharge brackets, TDS schedules (Sec 109–131), minimum tax |
| **Payment Orchestration** | Local + NRB payments | bKash Tokenized Checkout (4-step), SSLCommerz IPN, NRTA/NITA remittance dossiers |

**Architecture mandates:** PostgreSQL Row-Level Security (multi-tenant isolation), microservices + event-driven async, TLS 1.3 / AES-256, JWT auth, PgBouncer.

**Phased rollout in doc:** P1 infra+CRUD (wk 1–4) → P2 legal+financial+payments (wk 5–8) → P3 AI+RAG (wk 9–12) → P4 UAT+go-live (wk 13+).

### ⚠️ Reality check (engineering judgment)
- The doc is a **whitepaper-grade vision** — full microservices + PG-RLS + RAG + agent stack is a multi-month enterprise build.
- Our proven REM ERP approach wins here: **single-file PWA prototype → Flask backend → deploy**, iterating fast with visible results each phase.
- PG-RLS and microservices are **deferrable** — start with SQLite + tenant_id column (app-level isolation), migrate to PostgreSQL+RLS when real tenants arrive. The schema and logic stay identical.
- AI agent = **LLM API + function calling** (no self-hosted models needed at first); RAG = law texts chunked + embedded in SQLite FTS / lightweight vector store.

---

## 2. What we reuse from REM ERP (reference)

- **Design system:** `docs/design-reference-v10.html` (copied) — light theme, blue `#2F80ED`, SW versioned caching, manifest, mobile toolbar. Rebrand to KRTaker.
- **Backend pattern:** `app.py` (Flask + auth + CSRF), `db.py` (SQLite), `seed.py` (rich demo data), `portal.html` (customer portal with separate token auth).
- **Payment adapters:** bKash/Nagad adapter + sandbox checkout + shared `applyPaymentRipple` helper — bKash adapter maps directly to KRTaker's bKash Tokenized Checkout requirement.
- **Report generation:** reportlab (PDF invoices) + openpyxl (XLSX) endpoints.
- **Deploy stack:** gunicorn systemd unit + nginx reverse proxy + certbot (sslip.io hostnames) + Cloudflare tunnel for preview.

---

## 3. KRTaker Modules (prototype scope, mirroring REM's 53-module style)

Core groups (v1 — ~20 modules):
1. **Property Portfolio** — Properties, Units, Khatian/e-Porcha records, Jurisdiction (city corp)
2. **Tenancy** — Tenants, Leases (with registration-status engine), Security Deposits, Rent Schedules
3. **Financials** — Invoices, Rent Receipts (signed), TDS Ledger, Holding Tax, Capital Gains, Net Worth/Surcharge
4. **Compliance** — PRCA Checker, Eviction Workflow, Registration Tracker, Statutory Calendar
5. **Maintenance** — Tickets, Contractors, Liability Resolver, Repair Cost Ledger
6. **CRM** — Leads, Pipeline, Follow-ups, Sales Forecast
7. **Projects** — Renovation Tasks, Milestones, Resources, Cost Tracking
8. **Payments** — bKash Sandbox, SSLCommerz (later), Payment History
9. **AI Assistant** — Chat UI, Lease Q&A, Tax Answers, Autonomous Actions (issue ticket, send reminder, generate invoice)

---

## 4. Execution Plan (REM-ERP-style, 7 phases)

### Phase 0 — Scaffold & Brand ✅ (done: reference files copied)
- `/root/KRTaker` created; `docs/design-reference-v10.html` + backend reference files in place.

### Phase 1 — KRTaker PWA Prototype (SW v1.0)
- Fork REM V10 design → rebrand "KRTaker" (Key Responsibility Taker), blue theme retained.
- Build modules: Properties → Units → Tenants → Leases → Invoices → Receipts → Maintenance → Compliance → Taxes → Payments → AI Chat.
- **Lease registration gate** (doc requirement): lease >12 months → status "Pending Registration", ledger inactive until registration metadata uploaded.
- **PRCA hard validations** (doc): advance ≤ 1 month rent (residential) w/ manual override; rent-hike flags; eviction flow gated on 3-month unpaid detection.
- **TDS split on invoices** (doc): corporate tenant → net rent + TDS line (Sec 109 / 115 / 126 rates table).
- **Holding tax calculator** (doc): Gross Annual Rent → −2mo maintenance allowance → −mortgage interest → Net Annual Value → city corp rate.
- SW version `krtaker-v1-0`; serve on port 8878 + Cloudflare tunnel preview.

### Phase 2 — Backend Core (Flask + SQLite)
- Auth + RBAC (Owner/Admin/Agent/Tenant roles), JWT-ish tokens (reuse REM pattern).
- CRUD APIs for all core entities; tenant_id column on every table (app-level isolation now; PG-RLS later).
- `seed.py` — realistic BD demo: 5 properties (flat/plot/commercial), 8 units, 10 leases (mix ≤1yr & >1yr to demo registration gate), invoices, TDS cases, maintenance tickets.
- Reports: PDF rent receipt (crypto-signed header), holding tax statement, TDS certificate.

### Phase 3 — Compliance & Financial Engines (server-side)
- PRCA rule engine: rent revision window (2yr), advance cap, eviction grounds checker.
- Holding tax engine: Net Annual Value pipeline per doc formula.
- TDS ledger: auto-split, PSR tracking, +50% TDS rate if docs missing (doc mandate).
- Wealth surcharge bracket calculator (4Cr–50Cr+ table from doc).

### Phase 4 — Payment Gateways (sandbox first)
- bKash Tokenized Checkout: grant → create → execute → query flow (reuse REM bKash adapter, rewire to `tokenized.sandbox.bka.sh`), Redis-less token cache (in-DB).
- SSLCommerz GWPROCESS + IPN validation (Phase 2 of doc; can be stub + live-ready seams).

### Phase 5 — AI Agent (chat + function calling)
- Chat UI in PWA; backend `/api/ai/chat` → LLM API (DeepSeek/OpenAI-compatible) with tool definitions: `generate_invoice`, `create_ticket`, `check_lease_liability`, `calc_holding_tax`, `send_reminder`.
- **Permission inheritance** (doc): tool calls execute as the authenticated user; tenant-role agent cannot touch lease terms (backend RBAC enforces).
- RAG: ingest PRCA 1991 / TPA 1882 / Income Tax Act 2023 (public texts) → chunk + embed → SQLite FTS + vector table; `ask_legal()` tool.

### Phase 6 — Multi-tenant Hardening (PostgreSQL + RLS)
- Migrate SQLite → PostgreSQL; `ENABLE ROW LEVEL SECURITY` on all tenant tables; `app.current_tenant` session var from JWT; ORM injects explicit `WHERE tenant_id = X` (doc: RLS as backstop, not primary filter).
- PgBouncer-ready pooling; tenant context cleared on connection reuse.

### Phase 7 — Deploy
- gunicorn systemd `krtaker-backend` + nginx (`krtaker.18.142.98.150.sslip.io`) + certbot; PWA on `app.…sslip.io`; Cloudflare tunnel for interim HTTPS. (Reuse REM deploy recipes.)

---

## 5. Acceptance criteria per phase
- **P1:** Prototype renders all modules; registration gate + PRCA validations + TDS split + holding tax calc work in-browser; zero JS errors (browser verify).
- **P2:** All CRUD via API; seed loads; PDF/XLSX exports valid.
- **P3:** Engine unit cases pass (doc examples: ৳2.2Cr invoice, TDS 5–10%, holding tax formula).
- **P4:** bKash sandbox end-to-end payment + callback idempotency (reuse PAY-013/014 test methodology).
- **P5:** Chat answers legal Qs from RAG; agent actions complete with correct RBAC denial on cross-role tools.
- **P6:** RLS policy test: tenant A cannot read tenant B rows via direct SQL.
- **P7:** HTTPS live, boot-enabled, DB backed up.

---

## 6. Deliverables
- `/root/KRTaker` — repo (github.com/deshiklab/KRTaker), PWA prototype + backend + docs
- Phase-by-phase zips to Telegram (≤50 MB)
- Demo script + walkthrough like REM ERP

## 7. Open questions for Belal
1. **Repo:** push to `deshiklab/KRTaker` (public) or private `kabirswe/KRTaker`?
2. **AI provider:** DeepSeek (cheap, current) or OpenAI-compatible endpoint for the agent?
3. **Scope of Phase 1 prototype:** full 20-module build, or start with 8 core modules (Portfolio + Tenancy + Financials + AI Chat)?
4. **bKash sandbox creds** — need App Key/Secret from the bKash developer portal (or reuse REM sandbox pattern with placeholder creds).
