# SA1 v17 — Real-life lifecycle testing + invoice net bugfix

**Date:** 2026-08-05 · **Branch:** superadmin-panel · **No version bump** (API fix + tests, panel untouched)
**Commits:** see git log · **3 remotes**

## What shipped
1. **BUGFIX (deployed live + verified):** `app-crud` invoice update zeroed `net` on status-only
   edits (mark Overdue/Paid) — `net = (gross ?? 0) − (tds ?? 0)` with absent gross/tds → 0.
   Now net is re-derived ONLY when gross/tds are in the payload, else preserved.
   - Symptom: invoice looked "fully paid", gateway init → *"Invoice already fully paid."*
   - Rig + live verified: status-only update keeps net (22,500 preserved).
2. **New suite `test_lifecycle.py`** — 14 real-life scenarios, 149 checks
   (onboarding → register/OTP → RBAC → properties → payments/receipts → tickets → profile).
   Wired into `run_all.py` (full regression now **2824/2824**, 49 suites).
3. **Report:** `docs/LIFECYCLE_TEST_REPORT.md` — scenario/test-case tables + findings.

## Data findings (reported, not fixed)
- **U-011 (Flat 1A) references P-006 which is not seeded** — orphan unit, invisible in drill-down.
- **INV-2026-0009 zero-pad** inconsistent with auto-increment (0009 vs 0010/0011).
- **Trial plan = full base modules + unlimited limits** (plan_for_user('Trial') → no catalog row →
  base matrix fallback). Consider a `trial` catalog row mapping to Starter-like limits.

## Rig lessons (CRITICAL — dual API copy trap)
- The rig serves **TWO** API copies:
  - `php -S ... router.php` routes `/api/*` → **`/tmp/krtest/api/index.php`**
  - **any bare path** (no `/api/` prefix) falls through to the directory index →
    **`/tmp/krtest/index.php`** — a SECOND, easily-stale copy!
- **Always sync the API to BOTH:** `cp deploy/api/index.php /tmp/krtest/index.php /tmp/krtest/api/index.php`
- The bare-path copy is what ALL `helpers.api('/app-…')` test calls hit. Syncing only
  `/tmp/krtest/api/index.php` → tests silently run the OLD code (frustrating 30 min debug).
- **Stale 8899 process:** `kill` may fail silently if the command errors first; verify with
  `ss -tlnp | grep 8899` that the old pid is gone and the new one owns the port.
  A background process that fails to bind exits with "Address already in use" — check `process poll`.
- **Test probing convention:** for "is permission passed?" probes use `update {}` (→ 400 "No valid
  fields") NOT `create {}` — create auto-fills defaults for leases (status) and invoices (net),
  silently creating junk rows.

## run_all reset additions (self-healing)
- `DELETE FROM ticket_thread WHERE ticket NOT IN (SELECT id FROM tickets)` (dangling thread rows
  pollute reused ticket ids — p8910 expects exactly open + 2 comments).
- `UPDATE invoices SET net = gross - tds WHERE gross > 0 AND net != gross - tds` + canonical
  statuses for INV-2026-001/004/005/006/008 (P41 aging/trends stability).
- Dangling leases/invoices/payments/receipts/gateway_tx cleanup + lifecycle fixture markers
  (`LC %` names, `lc%@example.com`, etc.).

## Profile/password facts
- Password change API: `app-profile` with **`old_password` + `new_password`** (NOT `password`/`password2`).
- Changing password **invalidates all existing sessions** (old token → 401) — test the
  "change w/o old password 400" case BEFORE the change.
- Invoice print HTML formats money with commas (`42,500`) — strip commas when asserting amounts.
