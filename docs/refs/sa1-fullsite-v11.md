# SA1-fullsite-v11 — Custom Domains / CNAME Verify (v3.65 / SW v72, 2026-08-12)

User: "Add pagination and advanced filter options in each table view of Super Admin
Panel. And then continue to next tasks (CNAME verify → Theming v2)." v3.64 shipped the
table toolkit; this ref = **v3.65 / SW v72 — tenant custom domains** (CNAME/TXT verify +
per-domain routing), the #4 spec-gap item.

## What it does
Super Admin can register a subscriber's custom domain, get a unique verification token,
instruct the tenant to add a CNAME (@ → krtaker.com) + a TXT record on
`_krtaker.<domain>`, then verify with a real `dns_get_record` DNS_TXT check. Verified
domains resolve through the public `host-tenant` endpoint (Host header → tenant profile
+ white-label branding), enabling the tenant's portal to be served from their own domain.

## Backend (api/index.php)
- **`tenant_domains`** table (tenant_id, domain UNIQUE, verify_token, verified,
  verified_at, last_checked_at, last_check_note, created_at) + idx_td_tenant — schema
  section.
- **app-admin sub-actions**: `cnames` (list masked token via mask_secret + LEFT JOIN
  subscribers tenant_name/email/plan/status + subscriber options) · `cname-save`
  (tenant required 400 / unknown 400; domain validation regex `^(?!-)[a-z0-9-]{1,63}
  (?<!-)(\.[a-z0-9-]{1,63})+$`, rejects krtaker.com subdomains, dupes 400; create →
  `krt-verify-` . bin2hex(random_bytes(12)) token returned ONCE; update resets
  verified=0) · `cname-verify` (dns_get_record `_krtaker.<domain>` DNS_TXT, matches
  token substring; updates verified + verified_at + last_checked_at + last_check_note;
  audited OK/FAIL) · `cname-delete`. All audited.
- **`case 'host-tenant'`** (public, GET whitelist): host = body['host'] ?? HTTP_HOST,
  lowercased, port + www stripped; looks up verified=1 tenant_domains; 404 if none;
  returns tenant profile (id/name/email/plan/status) + verified_at + `brand` (all
  `wl_%` admin_settings keys) for theming.

## Frontend (superadmin.html)
- **🌐 Custom Domains** view registered in renderNav DEVELOPERS group
  (`['api','ai','webhooks','domains']`) + NAV/NAV_DESC/render map. Stats row (Domains /
  Verified / Pending / host-tenant), table via table toolkit (`tblPanel('doms')`):
  domain, tenant, status badge (✓ verified / ⏳ pending), masked TXT token +
  last-check note, verified-at, actions 🔎 Check DNS / ✎ / 🗑.
- `domainForm` (subscriber select + domain input), `domainSave` (create → `domainShowToken`
  drawer with `_krtaker.<domain>` + token + copy; update → toast reverify),
  `domainVerify` (toast ✓ or note), `domainDelete` (confirm).
- `host-tenant` added to API_CATALOG ('GET','public','Tenant').

## Pitfalls / class-notes
- **Live API probes must use `https://krtaker.com/api/<action>`** — bare
  `https://krtaker.com/<action>` 404s with the HTML 404 page (helpers.py BASE is rig-only;
  live_tkey363.py pattern: BASE='https://krtaker.com/api').
- **host-tenant host priority**: read `body['host'] ?? HTTP_HOST` (NOT HTTP_HOST first) —
  the rig/browser always sends a real Host header (127.0.0.1:8899), so an explicit host
  param is required for tests and previews; real CNAME traffic still resolves via HTTP_HOST.
- PHP's built-in server serves the docroot `index.php` for bare paths (e.g. `/sitemap`,
  `/host-tenant` without /api) — keep `/tmp/krtest/index.php` synced to the live API or
  stale copies crash on dropped columns (v3.64 lesson; re-verified this version).
- `dns_get_record` works on PHP 8.1/8.4 shared hosting (no extension needed).
- Version guards: SW v71→v72 (`krtaker-site-v72`), `?v=3.64`→`3.65` on 11 web pages;
  cleanup sets version/sw_version v3.65/v71; the pre-existing sidebar + renderNav guards
  hardcoded `['api','ai','webhooks']` → updated to include 'domains'.

## Verify
- Rig smoke **19/19** (RBAC, validations, create+token, dup, mask+join, verify-fail,
  unverified/unknown 404, verified profile+brand via DB-simulated DNS success,
  www+port normalization, update-resets-verified, delete, cleanup).
- test_superadmin **428/428** (397 + 31 new).
- Full run_all **2592/2592** (48 suites).
- Live API probe **11/11** (host-tenant 404s, cnames RBAC, create, verify-fail with real
  DNS lookup, unverified 404, delete, DB clean).
- Live browser E2E: 🌐 Custom Domains in DEVELOPERS group → empty state + verified filter
  → ＋ Add domain (Belal Ahmed / portal.e2e365.com) → 🔑 token drawer (35-char
  krt-verify-…) → row pending + masked token → 🔎 Check DNS → real DNS fail note
  ("TXT record not found yet — add …") → 🗑 delete → 0 rows · 0 JS errors · live DB clean.
