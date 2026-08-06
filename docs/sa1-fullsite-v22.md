# SA1-fullsite v22 — Rent-Due Push Notifications (panel+API, no version bump)

Shipped 2026-08-12 on branch `superadmin-panel`. API + dashboard changes → **no version bump** (precedent: v18–v21). Live = v3.66 / SW v74 + v22. Commit: `PENDING` → 3 remotes.

## Why

The collections digest **emails chase tenants** (`app-collections-run` groups unpaid invoices by `temail`); the day-1/7/15 scheduler escalates **emails** to tenants. But push subscriptions (`push_subs.sub_email`) live on **owner devices** (registered from the PWA dashboard, v19). Nothing was proactively telling the OWNER "your rent is due / overdue" — they only see it when they open the dashboard. v22 closes that gap: owners with push enabled get a Web Push alert on the same schedule as the digest cron.

## API

### Helper `rent_due_push_data($pdo, $lookahead = 1)` (global functions area — NOT inside a switch case)
- Owners = `SELECT DISTINCT sub_email FROM push_subs` (only accounts with ≥1 registered device).
- Per owner: `invoices i JOIN leases l JOIN units u JOIN properties p JOIN tenants t WHERE p.sub_email=? AND i.status!='Paid'`; `due = net − SUM(payments Success)`; skip `due<=0`.
- Month classification vs `gmdate('Y-m')`:
  - `overdue` — `m < cur`
  - `due_soon` — `m == cur`
  - `upcoming` — `m` in next N months (`lookahead` 0..6, default 1)
  - anything else (paid months, beyond lookahead) → excluded entirely; `invoices` counter only counts windowed rows (fixed after test caught it counting far-month invoices).

### Action `app-rent-due-push` (POST-only; after `app-reminder-run`)
- Auth: `service_authed()` via `X-Service-Key` (cron) OR user with `recon` module (dashboard/manual). Service path sets `$u = system`.
- `send=0` → dry-run: `{ok, dry_run:true, targeted, totals:{overdue,due_soon,upcoming,invoices}, owners:[{email, overdue, due_soon, upcoming, invoices, suppressed}], last_run}`.
- `send=1` → per owner (unless suppressed): `push_to_user($pdo, email, 'Rent due — KRTaker', '৳X overdue · ৳Y due this month · ৳Z due next month', '/dashboard-v2.html')`.
- **Gates identical to reminder emails**: `mail_switch($pdo,'rent_reminders')` (admin master) + `notify_ok($pdo,email,'notify_rent')` (per-user opt-out). Suppressed owners: counted, flagged, **device NOT removed**.
- Dead endpoints (404/410) removed by `push_to_user` (existing v19 behavior).
- Records `platform_meta.last_rent_due_push` (timestamp + stats) + audit `Rent-due push run`.

### `app-collections-summary`
- Now also returns `last_push` (the `last_rent_due_push` meta) for the dashboard footer.

## Dashboard (`docs/dashboard-v2.html` → live)
- Recon collections panel header: `🔔 Push owners` link next to "Send reminders" → `pushRentDue(true)` (confirm() first).
- New `pushRentDue(send)`: calls `app-rent-due-push`; toast `🔔 Sent X/Y push(es) · Overdue ৳A · This month ৳B · N opted out` (dry-run: `Dry-run: N owner(s) · Overdue ৳A`); refreshes after send.
- Footer: `Last run: … · push: …`.

## Cron wiring (cPanel — same pattern as the existing collections digest)
Add a second cron line:
```
curl -s -X POST https://krtaker.com/api/app-rent-due-push -H "Content-Type: application/json" -H "X-Service-Key: <SERVICE_KEY>" -d '{"send":1}'
```
(run after/daily with the collections digest; `send=0` any time for a dry-run preview from the dashboard.)

## Tests — `test_rentdue.py` 26/26
- Auth: no token 401; tenant (no `recon`) 403; owner (recon) dry-run OK.
- Service dry-run: `targeted==1`, owner email, exact buckets `overdue 12000 / due_soon 6000 (8000 − 2000 payment) / upcoming 9000`, `invoices==3` (Paid + far-month excluded).
- `lookahead=0` → upcoming excluded, invoices 2.
- Send path: fake FCM endpoint → 404 → `removed==1`, push_subs row deleted, `platform_meta` written, `last_run` set.
- Master switch `mail_rent_reminders=0` → suppressed, device kept. Per-user `notify_rent=false` → suppressed, device kept.
- Cleanup verified (no leftover rows).
- Pitfalls: `audit_log` column is `action` (not `name`); valid real curve-point p256dh/auth needed so `webpush_encrypt` doesn't throw; assertions must be relative to the RDP owner (other suites may leave push_subs rows) — test deletes all push_subs at seed time for determinism.
- Wired into `run_all.py` (reset block cleans `RDP-`/`rdp-` rows + restores `mail_rent_reminders='1'`; suite list now 53).

## Regression — 2961/2961, 0 failed (53 suites)
Includes **v21c**: `test_superadmin` caught `faq.html version 3.66` FAILED — v21b had whole-file-synced stale unversioned copies over `web/faq.html` + `web/ai-caretaker.html` (dropping v=3.66 assets, GA4, `data-page`/`data-cms` hydration hooks, manifest, breadcrumb JSON-LD). Restored both from `d834bda` (v12 last-good) → 511/511, 2961/2961.

## Live verification
- API 1,298,806 B + 60/60 files deployed (deploy_landing.py + ftp_api_p45.py).
- `curl` service dry-run: `{"ok":true,"dry_run":true,"targeted":0,...}` (pristine DB — no push subs).
- faq.html live: 56 markers; ai-caretaker.html live: 54 markers (v21c fix live).
- Browser: login → recon → `pushRentDue` function + onclick live; UI dry-run toast `Dry-run: 0 owner(s) · Overdue ৳0`; 0 console errors / 0 JS errors.
- Pre-existing finding (untouched by v22): `loadRecon`'s `Promise.all` of two API calls flakes ~2/3 on live (SQLite concurrent request → empty body → JSON parse error) — recon view falls back to "Live reconciliation unavailable — showing local data". Worth a future fix (sequentialize or retry).
