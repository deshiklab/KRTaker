# SA1-fullsite-v15 — Onboarding & CRM Kanban + full CRM CRUD + Subscriber profile (panel+API, 2026-08-12)

User: "In Onboarding & CRM (superadmin.html) add kanban view. Also add more detailed and advanced features. Add more details information in Subscribers (in add, edit & also in the view)."
Panel + API extension, no web/dashboard change → **no version bump** (live stays ?v=3.66/SW v73). Commit `23110df` → 3 remotes.

## Backend (api/index.php, rig-synced to /tmp/krtest/api/index.php + /tmp/krtest/index.php)
- **Subscribers schema**: idempotent `ALTER TABLE subscribers ADD COLUMN` loop for `photo, address, city, industry, company_size, website, notes, tags` (extended the existing photo-only block).
- **`subscribers` action**: now loops rows adding `tenants` (COUNT tenants WHERE sub_email=email) + `partners` (COUNT partners WHERE sub_email=email).
- **`subscriber-save`**: accepts + persists the 7 new fields (address/city/industry/company_size/website/notes/tags) on both INSERT and UPDATE.
- **10 new app-admin endpoints** (inserted right after the `onboarding` action):
  - `lead-save` (create: `LD-` + zero-pad max+1; update: name/phone/email/prop/source/message/status/assigned_to/notes + `updated_at=datetime('now')`), `lead-delete`, `lead-status` (status ≤40 chars),
  - `lead-convert` → creates `OB-` app from lead (copies name/email/phone/prop, notes prefixed `Converted from lead <id>\n`, status 'Started'), sets lead status → 'Applied', returns `onboarding_id`,
  - `onboard-save` (create `OB-` min 100; update with `verified_at=COALESCE(?, verified_at)` — pass gmdate now when verified_by non-empty), `onboard-delete`, `onboard-status`,
  - `referral-save` (create `REF-`+random hex), `referral-delete`, `referral-status`.
- All audited. `php -l` clean (1.26 MB).

## Frontend (docs/superadmin.html)
- **State**: `ONB_V={l:'table',o:'table'}` view flags; pipeline consts `LEAD_PIPE=['New','Contacted','Qualified','Viewing','Applied','Negotiation','Won','Lost']`, `ONB_PIPE=['Started','Submitted','Verified','Approved','Rejected']`, `REF_PIPE=['Pending','Signed up','Paid','Reward issued']`.
- **renderOnboarding()** gains 3 add buttons (＋ Lead / ＋ Application / ＋ Referral) and per-panel 📋 Table / 🪟 Kanban toggle (`onbToggleHtml`/`onbSetView`); kanban replaces the table body per section; referrals stay table-only.
- **Kanban** (`kanbanHtml`/`kbLeadCard`/`kbOnbCard`): horizontal scroll `kb-wrap`, columns by pipeline status + auto "Other" col for unknown statuses, card count badges, age badges (Nd), source/assignee/NID/verified tags. **HTML5 drag&drop** (`kbDragStart`/`kbDragEnd`/`kbOver`/`kbLeave`/`kbDrop`) → `leadStatus`/`onbStatus` API → optimistic local update + re-render. Dropping into "Other" is blocked (use edit form).
- **Row actions** (table + cards): 👁 view, ✎ edit, 🔄 convert (leads), ➡️ advance (`leadAdvance`/`onbAdvance` next pipeline stage), 🗑 delete.
- **CRUD drawers**: `leadForm`/`leadSave` (source select + status select + assigned + message + notes), `onbForm`/`onbSave` (nid/unit/prop/rent/adv/months/start/verified_by), `refForm`/`refSave` (code/user_email/role/referred/reward/status); deletes with confirm.
- **Subscribers**: form extended with Address/City/Industry/Company size select/Website/Tags/Notes; `subscriberDetail` shows all new fields + a `mix-total` footer with 🏠 Tenants / 🛠️ Providers counts (`detDrawer` gained an optional `extra` param).
- CSS: `.kb-*` block (board, columns, cards, tags, age, drag states, view toggle buttons) using existing CSS vars.

## Verify
- test_superadmin **480/480** (452+28 static guards) · full regression **2644/2644** (48 suites, 0 failed).
- Runtime API smoke: lead create LD-088 → status Qualified → convert → OB-100 (lead→Applied) → onboard update (unit/rent/adv/verified_by sets verified_at) → referral create/status → subscriber extended fields stored + stats in list — all cleaned.
- Rig browser E2E: kanban renders 8 lead + 5 onboarding columns, 87 draggable cards; simulated drag LD-088 New→Qualified persisted; lead create via UI → DB; convert → OB-100 with notes carry-over; referral create REF-9EA92C; subscriber form shows 7 new fields, save persists, detail shows all + stats. **0 JS errors**. Test data cleaned, subscriber #1 restored pristine.
- Live: API deploy (ftp_api_p45.py 1,255,541 bytes) + deploy_landing.py **59/59**; live probes (login → subscribers with tenants/partners keys + extended cols → lead-save LD-007 → lead-convert OB-101 → cleanup); live browser (kanban 8 pipeline cols + Other, 6 cards, ＋ Lead; subscriber extended form) **0 JS errors**; live DB untouched.

## Pitfalls
- **Rig router path**: `php -S 127.0.0.1:8901` router.php requires `/tmp/krtest/api/index.php` (a directory!), NOT `/tmp/krtest/index.php` — syncing the wrong path gives "Unknown admin action" on every new endpoint (looks like a JS bug, it's a stale API).
- Kanban "Other" column is display-only (no drop) — unknown statuses need the edit form.
- `onboard-save` verified_at uses `COALESCE(?, verified_at)` with a PHP `null` param when verified_by empty — keeps existing timestamp.
- Lead/onboarding IDs are strings — always quote in onclicks.
