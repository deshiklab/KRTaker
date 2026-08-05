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

## Round 2 (same session) — all findings fixed + full re-test
- **FIX-02 U-011 orphan:** root cause = old rig migration added U-011→P-006; P-006 never existed in
  seed; test_p56 hardcodes U-011 as fixture. Fixed: seed U-011→P-005 + run_all INSERT OR IGNORE fixture.
  Live was already clean (10 units, no U-011).
- **FIX-03 invoice pad:** run_all re-inserted 3-digit INV-2026-010 every run → normalized to 4-digit
  INV-2026-0010 + restored INV-2026-0009 (July 28k) which the reset was accidentally deleting
  (P41 aging regression caught by re-test). Seed 001–008 stay 3-digit (legacy, tests depend).
- **FIX-04 Trial = full access:** effective_modules/effective_limits now map 'trial' → starter catalog
  (1 prop / 5 units / 1 seat / no AI / no API; modules exclude maintenance+). package.code stays
  'trial' (dashboard banner unaffected). Verified live (Enterprise owner unchanged).
- **NEW NOTE-02:** property_limit/unit_limit are display-only (no create-time enforcement); global
  enforcement would break trial UX in the shared dataset → enforce per-subscriber in Phase 7.
- **NULL trap:** `x NOT IN (subquery)` silently SKIPS NULL x — dangling-row cleanup must use
  `x IS NULL OR x NOT IN (...)`. Junk invoices with l=NULL (empty-data create artifacts) survived cleanup.
- **Re-test:** lifecycle 157/157 (SC-02 +2 trial asserts, SC-15 +6 integrity) · run_all 2832/2832.
- Live: API redeployed (1,262,370 B); liveprobe subscriber cleaned via app-admin subscriber-delete.
