# SA1 v18 — Per-subscriber plan limits (enforced) + live catalog self-heal

**Date:** 2026-08-06 · **Branch:** superadmin-panel · **No version bump** (API + panel toast, panel-only)
**Commits:** see git log · **3 remotes** · Live API 1,268,528 B

## What shipped
1. **`sub_email` scoping on properties + units** (idempotent migration + one-time backfill):
   - `ALTER TABLE properties/units ADD COLUMN sub_email TEXT DEFAULT ''` via the boot migration map.
   - One-time backfill (guarded by `platform_meta.sub_email_backfill_v1`): seeded demo portfolio →
     `owner@krtaker.com`; units inherit from their property. Future rows are stamped at create time.
2. **Create-time enforcement in `app-crud`** for subscribers (`kind='sub'`), collections
   `properties`/`units`:
   - property create: count `properties WHERE sub_email=me` ≥ `property_limit` → **403**
     `"Plan limit reached: N of M properties. Upgrade to lift limits."`
   - unit create: parent property owned by another account → **403** `"This property belongs to another account."`;
     count own units ≥ `unit_limit` → **403** `"Plan limit reached: N of M units. ..."`
   - Subscribers can never set `sub_email` directly: create enforcement stamps it (client value
     overwritten), update path strips it. Staff/superadmin (kind != 'sub') are unlimited.
3. **Live catalog self-heal (real bug found during live verification):** live `plan_catalog`
   rows had `limits='[]'` (empty JSON array) — the P55 backfill only treated `'{}'`/empty as
   stale, so **per-plan caps never applied on live** (Trial users actually had 9999/99999).
   Boot schema block now backfills `modules`/`limits` when they're empty/`'{}'`/`'[]'` from
   canonical definitions (mirrors `seed_app()`). Verified live: catalog now starter 1/5/1,
   business 10/50/3, enterprise 9999/99999/10.
4. **Panel:** `saveForm()` now toasts `d.error` on failed create/update (limit/scope messages
   previously vanished silently — apiCall returns raw json with no global error handler).

## Tests
- `test_lifecycle.py` **SC-16** (9 checks): fresh trial sub → prop #1 OK (stamped sub_email),
  prop #2 403, 5 units OK, 6th unit 403, cross-account unit 403, Enterprise owner create OK.
- Cleanup additions: `DELETE FROM units/properties WHERE sub_email LIKE 'lc%@example.com'`.
- Full regression **2841/2841** (49 suites · lifecycle 166/166 · superadmin 511/511).

## Live verification (curl — browser session flaky after long runs)
- owner login → `app-me` catalog now shows real limits (was `[]`).
- subscriber-save (plan=starter, NOTE: `trial` is NOT a catalog code → subscriber-save rejects it)
  → impersonate → app-crud as the trial sub: prop1 200/P-006, prop2 **403** "Plan limit reached:
  1 of 1 properties", 5 units OK, unit6 **403** "5 of 5", cross P-001 **403** "another account",
  enterprise owner create 200 (P-007, deleted). Cleanup: delete units → prop → subscriber-delete.
- Live left pristine: 5 properties / 10 units / 0 LC rows.

## Pitfalls
- **`subscriber-save` rejects plan `'trial'`** (no catalog row) — use `'starter'` for live limit tests.
- **Live catalog limits were `'[]'`** — always verify `app-me` catalog on live after any plan work;
  rig tests passing does NOT imply live data is correct (rig DB was seeded properly, live wasn't).
- **`seed_app()` only runs via the seed endpoint** — never rely on it for live self-heal; put
  backfills in the boot schema block (runs every request via db()).
- Browser (Browserbase) pages silently reset to `about:blank` mid-session → use curl/python
  urllib for long live verification scripts; keep browser for UI checks only.
- Impersonation mints a `kind='sub'` token — perfect for testing subscriber-gated enforcement
  without knowing the subscriber's password.
- Unit id sequence: `next_id()` = MAX+1, so deleted ids (P-006) get reused — don't assume
  monotonic ids across test runs.
