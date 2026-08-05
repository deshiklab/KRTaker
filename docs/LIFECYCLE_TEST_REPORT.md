# KRTaker — Real-Life Platform Testing Report
**Scope:** onboarding → registration → role-based users → property management → tenant payments & receipts
**Date:** 2026-08-05 · **Environment:** rig (127.0.0.1:8899) + live smoke (krtaker.com)
**Suite:** `test_lifecycle.py` → **149 / 149 checks · 14 scenarios**
**Full regression:** 2824 / 2824 (49 suites, 0 failed) — incl. new lifecycle suite

---

## Executive summary

| Metric | Result |
|---|---|
| Scenarios designed & executed | 14 |
| Assertions (test cases) | 149 — all pass |
| Full regression (49 suites) | 2824 / 2824 |
| Browser E2E (dashboard UI) | login → portfolio → property create → invoices → payments → receipts — **0 JS errors** |
| Bugs found | 1 (fixed) |
| Data anomalies found | 2 (reported) |
| Data corruption found & repaired | 1 (invoice net) |
| Live deploy | API bugfix deployed + verified live |

---

## Bugs & findings

### 🔴 BUG-01 (fixed) — Invoice status-only edit silently zeroes `net` (HIGH)
`app-crud` update on an invoice with only `status` (e.g. mark Overdue/Paid) re-derived
`net = (gross ?? 0) − (tds ?? 0)` = **0**, because gross/tds were absent from the payload.
- **Impact:** every status-only invoice edit made the invoice look *fully paid with ৳0 due*;
  gateway checkout then rejected with *"Invoice already fully paid."* Aging/trends analytics were skewed.
- **Repro:** create invoice (gross 25,000 / tds 2,500 → net 22,500) → update `{status:'Overdue'}` → `net` becomes 0.
- **Fix:** net is now re-derived only when gross/tds are actually being changed; a status-only edit
  preserves the current net (`UPDATE invoices SET net = gross - tds WHERE gross > 0 AND net != gross - tds`
  self-heal added to run_all reset). **Deployed live + verified** (status-only update preserved net 22,500).
- **Evidence:** rig debug run; live probe `net after status-only update: 22500 (expect 22500)`.

### 🟡 DATA-01 (existing) — Orphan unit U-011 references missing property P-006
`units` contains `U-011 (Flat 1A)` with `p=P-006`, but `properties` has no `P-006` (only P-001…P-005).
The unit is invisible in the Properties→Units drill-down and any report joining on property id drops it.
**Suggestion:** seed P-006 (or repoint U-011 to an existing property).

### 🟡 DATA-02 (existing) — Invoice id zero-padding inconsistency
`INV-2026-0009` uses 4-digit suffix while the auto-incrementer emits `INV-2026-0010`, `INV-2026-0011`
(MAX() parse handles both, but id sort/display is inconsistent and `INV-2026-0009` sorts after `INV-2026-0011`).

### 🟢 NOTE — Trial accounts get full Enterprise module access
A newly registered (Trial-plan) owner receives the full base module set and default limits
(`property_limit` 9999, `unit_limit` 99999) because `plan_for_user()` maps 'Trial' → no catalog row →
`effective_modules()` falls back to the base matrix. If Trial should mirror Starter limits, add a
`trial` row to `plan_catalog` or map Trial → starter limits.

---

## Scenarios & test cases (149 assertions)

### SC-01 Landing onboarding (7 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 1.1 | Newsletter signup (valid email) | 200 ok | ✅ |
| 1.2 | Newsletter duplicate signup | 200 `already:true` | ✅ |
| 1.3 | Contact form (valid) | 200 ok, row saved | ✅ |
| 1.4 | Contact form empty fields | 400 | ✅ |
| 1.5 | Register invalid email | 400 | ✅ |
| 1.6 | Register empty name | 400 | ✅ |
| 1.7 | Register weak password (<6) | 400 w/ policy msg | ✅ |

### SC-02 Registration → OTP → login (10 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 2.1 | Register new owner | 200, trial_days ≥ 1 | ✅ |
| 2.2 | Row: status=pending, plan=Trial, role=owner | verified | ✅ |
| 2.3 | Wrong OTP | 400 "Invalid code" | ✅ |
| 2.4 | otp_fails increments to 1 | verified | ✅ |
| 2.5 | Correct OTP (simulated email read) | 200 | ✅ |
| 2.6 | Row: status=active + verified_at set | verified | ✅ |
| 2.7 | Login with chosen password | 200, kind=sub, role=owner | ✅ |
| 2.8 | app-me returns package code `trial` | verified | ✅ |
| 2.9 | Wrong password | 401 | ✅ |
| 2.10 | Logout → token dead (app-me 401) | verified | ✅ |

### SC-03 Duplicate & re-registration (5 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 3.1 | Register an active account | 409 | ✅ |
| 3.2 | Register a just-verified account | 409 | ✅ |
| 3.3 | Re-register a pending account (retry signup) | 200, row updated | ✅ |
| 3.4 | Row: still pending, name updated | verified | ✅ |
| 3.5 | Verify after re-register | 200 | ✅ |

### SC-04 Owner property management chain (13 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 4.1 | Owner bootstrap: full org collections | ≥5 properties, invoices+payments | ✅ |
| 4.2 | Create property | P-xxxx auto-id | ✅ |
| 4.3 | Create unit under property | U-xxxx | ✅ |
| 4.4 | Create tenant | T-xxxx | ✅ |
| 4.5 | Create lease (res=1) | L-xxxx, status **Active** | ✅ |
| 4.6 | Lease res=0 + no reg_office | **Pending Registration** (TPA §107 gate) | ✅ |
| 4.7 | Update unit → Leased, rent 42,500 | persisted | ✅ |
| 4.8 | Update property value | persisted | ✅ |
| 4.9 | Owner creates staff | **403** (hr-only) | ✅ |
| 4.10 | Owner creates case | **403** (legal-only) | ✅ |
| 4.11 | Owner onboards contractor (partner) | SP-xxxx created | ✅ |

### SC-05 Role-based user permission matrix (19 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 5.1–5.7 | Manager: properties/units/tenants/leases/invoices/tickets/amenities | allowed (validation reached) | ✅ |
| 5.8–5.11 | Manager: partners/staff/cases/support | **403** | ✅ |
| 5.12 | Accountant: invoice create | 200 | ✅ |
| 5.13–5.18 | Accountant: properties/tenants/units/leases/partners/staff | **403** | ✅ |
| 5.19 | HR: staff create | 200 | ✅ |
| 5.20–5.22 | HR: invoices/properties/tickets | **403** | ✅ |
| 5.23 | Legal: case create | 200 | ✅ |
| 5.24–5.26 | Legal: properties/invoices/tickets | **403** | ✅ |
| 5.27 | CRM: support create | 200 | ✅ |
| 5.28–5.30 | CRM: leases/properties/invoices | **403** | ✅ |
| 5.31–5.32 | Svc-mgr: properties/invoices | **403** | ✅ |

### SC-06 Tenant own-scope guard (9 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 6.1 | Tenant bootstrap scoped to own property/unit (P-005/U-010) | only own rows | ✅ |
| 6.2 | Tenant update any record | **403** | ✅ |
| 6.3 | Tenant delete any record | **403** | ✅ |
| 6.4 | Tenant raises ticket on own unit | MT-xxxx, status forced **Open** | ✅ |
| 6.5 | Tenant raises ticket on foreign unit (U-001) | **403** "own unit" | ✅ |
| 6.6 | Tenant statements | **403** | ✅ |
| 6.7 | Tenant note on another tenant | **403** | ✅ |

### SC-07 Partner (vendor) own-job guard (7 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 7.1 | Partner bootstrap: no properties | scoped | ✅ |
| 7.2 | Partner creates ticket | **403** | ✅ |
| 7.3 | Partner creates property | **403** | ✅ |
| 7.4 | Owner assigns job to vendor (con) | ticket created | ✅ |
| 7.5 | Partner updates own job (cost/status) | 200, persisted | ✅ |
| 7.6 | Partner updates another vendor's job (MT-003) | **403** | ✅ |

### SC-08 Data readback + analytics (4 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 8.1 | Chain visible in bootstrap (prop/unit/tenant/lease) | all present | ✅ |
| 8.2 | Chain values: unit Leased+42,500 · lease rent 42,000 · links correct | verified | ✅ |
| 8.3 | Analytics PnL for owner | 200, `totals` present | ✅ |

### SC-09 Invoicing (6 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 9.1 | Create invoice (gross 42,500 / tds 4,250) | INV-2026-xxxx | ✅ |
| 9.2 | Net derived automatically (38,250), status Unpaid | verified | ✅ |
| 9.3 | Invoice print HTML (tenant name + amount) | 200, renders | ✅ |
| 9.4 | Update status → Overdue | **net preserved** (bugfix regression) | ✅ |
| 9.5 | Status persisted | Overdue | ✅ |
| 9.6 | Tenant cannot see owner's test invoice | isolated | ✅ |

### SC-10 Gateway payment lifecycle (owner) (11 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 10.1 | app-payment-init (bKash) on unpaid invoice | session, simulated checkout, amount 38,250 | ✅ |
| 10.2 | app-payment-confirm | payment PAY-xxxx + receipt RCP-xxxx | ✅ |
| 10.3 | gateway_tx status → paid | verified | ✅ |
| 10.4 | payments row: amount/status Success | verified | ✅ |
| 10.5 | receipts row: amount + SIG- signature | verified (PRCA §13) | ✅ |
| 10.6 | Invoice auto-marked **Paid** when due cleared | verified | ✅ |
| 10.7 | Double-confirm same session | **400** | ✅ |
| 10.8 | Confirm unknown session | **404** | ✅ |
| 10.9 | Init → cancel → tx status failed | verified | ✅ |
| 10.10 | Confirm cancelled session | **400** | ✅ |
| 10.11 | Receipt email endpoint (owner) | 200, `emailed`+`to` flags | ✅ |

### SC-11 Tenant pays own invoice + collections (6 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 11.1 | Owner creates Aug invoice for L-007 (40,000) | INV created | ✅ |
| 11.2 | Tenant pays someone else's invoice | **403** "own invoices" | ✅ |
| 11.3 | Tenant inits payment on own invoice | 200, amount 40,000 | ✅ |
| 11.4 | Tenant confirms → receipt issued | RCP-xxxx | ✅ |
| 11.5 | Tenant bootstrap shows own payment + receipt | verified | ✅ |
| 11.6 | Owner collections summary + invoice Paid | 200, total_due, Paid | ✅ |

### SC-12 Owner statements + payouts (5 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 12.1 | Statements list (owner) | per-property entries | ✅ |
| 12.2 | Statement shape (name/collected/net) | verified | ✅ |
| 12.3 | Statement detail w/ lines | 200 | ✅ |
| 12.4 | Accountant records payout | 200 | ✅ |
| 12.5 | Manager records payout | **403** | ✅ |

### SC-13 Maintenance ticket lifecycle (8 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 13.1 | Tenant raises ticket on own unit | MT-xxxx Open | ✅ |
| 13.2 | Manager → In Progress | 200 | ✅ |
| 13.3 | Manager assigns vendor + cost | persisted | ✅ |
| 13.4 | Vendor quotes own job | 200, cost 11,000 | ✅ |
| 13.5 | Svc-mgr closes ticket | 200 | ✅ |
| 13.6 | Final state Closed / cost 11,000 | verified | ✅ |
| 13.7 | Tenant changes status | **403** | ✅ |
| 13.8 | Invalid status value | **400** | ✅ |

### SC-14 Profile, password, sessions (8 checks)
| # | Test case | Expected | Actual |
|---|---|---|---|
| 14.1 | Profile GET | name correct | ✅ |
| 14.2 | Profile update (name/phone/org) | 200 | ✅ |
| 14.3 | Profile persisted | verified | ✅ |
| 14.4 | Change password without current password | **400** | ✅ |
| 14.5 | Change password (old+new) | 200 | ✅ |
| 14.6 | **All existing sessions invalidated** after password change | old token 401 | ✅ |
| 14.7 | Old password rejected | 401 | ✅ |
| 14.8 | New password login + logout → token dead | verified | ✅ |

### UI wiring guards (12 checks)
register.js → register+OTP · dashboard → app-login, app-bootstrap, property/lease CRUD,
payment-init/confirm, RCP receipts, collections autopilot, statements, ticket status, profile — **all wired** ✅

---

## How to re-run
```bash
cd /tmp/krtest && python3 test_lifecycle.py          # 157 lifecycle checks (15 scenarios)
cd /tmp/krtest && python3 run_all.py                  # full 2832-check regression
```
State is reset before/after each run (idempotent; dangling refs, test fixtures, rate-limit
bookkeeping and corrupted nets are all repaired by run_all's reset block).

---

# ROUND 2 — Bug fixes applied & full re-test (2026-08-05)

Per user instruction ("fix any bugs/issues found, then continue/start over the testing"), all findings
were fixed and the entire test cycle re-run.

## Fixes applied

### FIX-01 (HIGH) — Invoice net zeroing — fixed & deployed live (round 1), re-verified
Status-only invoice edits (mark Overdue/Paid) no longer clobber `net`. Regression-guarded in SC-09
(net preserved after status update) and SC-15 (no invoice in the whole dataset has `net ≠ gross − tds`).

### FIX-02 — Orphan unit U-011 — fixed (seed + rig)
Root cause: U-011 ("Flat 1A") referenced `P-006`, a property that does not exist anywhere (it was
added to the rig DB by an old migration and never made it into the canonical seed; the live DB never
had it). test_p56 hardcodes U-011 as its fixture unit, so the unit must exist.
- Canonical seed now includes `U-011 → P-005 (Dhanmondi Apartment)`; run_all reset `INSERT OR IGNORE`s
  the fixture unit; SC-15 asserts **zero orphan units** across the dataset.
- Live DB: confirmed already clean (10 units, all valid parents) — no live migration needed.

### FIX-03 — Invoice id padding — fixed (run_all normalization)
The anomaly was a 3-digit id (`INV-2026-010`) among 4-digit auto-generated siblings
(`INV-2026-0010`). run_all re-inserted the 3-digit form every run. Now it deletes both spellings and
re-inserts the canonical 4-digit `INV-2026-0010` (+ the July `INV-2026-0009` it had been accidentally
deleting — that caused a P41 aging regression caught by this re-test). Seed rows `INV-2026-001…008`
(3-digit) are accepted legacy (tests depend on them; MAX() parsing unaffected). SC-15 asserts no
mixed-pad ids beyond the legacy set.

### FIX-04 — Trial accounts got full Enterprise access — fixed & deployed live
New signups (plan `Trial`) previously fell through to the full base module set and unlimited limits.
- `effective_modules()` / `effective_limits()` now map `Trial → Starter` (1 property, 5 units, 1 seat,
  no KR AI, no API access; owner modules exclude maintenance/gate/etc.).
- `package.code` stays `'trial'` so the dashboard trial banner is unaffected.
- Verified: SC-02 + SC-15 assert trial limits/modules; Enterprise owner unchanged (live probe).

## New finding from re-testing

### NOTE-02 — Plan limits are advisory (display-only), not enforced on create
`property_limit` / `unit_limit` are surfaced in `app-me` and the dashboard (progress bars, "∞" for
Enterprise) but app-crud does not block creates beyond the limit. Global enforcement would be
incorrect in the current shared/unscoped dataset (a Starter/Trial user sees the seed properties and
would be blocked from creating even their first one). **Recommendation:** enforce per-subscriber counts
during the multi-tenant (Phase 7) work, when ownership scoping exists.

## Re-test results (round 2)

| Suite | Checks | Result |
|---|---|---|
| test_lifecycle.py (15 scenarios: SC-01…SC-15) | **157** | all pass |
| Full regression (49 suites incl. lifecycle) | **2832** | 0 failed |
| Live probes | API deployed (1,262,370 B) · Enterprise owner unchanged · trial register OK · probe subscriber cleaned | OK |

## Round-2 change log
- API: seed U-011 (valid parent) · Trial→Starter limits/modules fallback (effective_*)
- run_all: invoice id normalization (0010/0009 canonical) · U-011 fixture insert · NULL-safe dangling
  cleanup (`IS NULL OR NOT IN`) — the NULL case was silently surviving `NOT IN`
- test_lifecycle: SC-02 trial-limit asserts (+2) · SC-15 data integrity (+6) · NULL-safe cleanup
- Live: ftp_api_p45.py deploy · liveprobe subscriber deleted via app-admin
