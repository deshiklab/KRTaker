# SA1-fullsite v21 — Application Security Hardening (panel-only, no version bump)

Shipped 2026-08-06 on branch `superadmin-panel`. API-only changes → **no version bump** (precedent: v4.4/v6/…/v20). Live = v3.66 / SW v74 + v21 hardening. Commit: pending.

## What was hardened (audit → fix)

Full audit of `/root/krtaker-deploy/api/index.php` (~1.29 MB). Already strong (no changes needed):
- bcrypt (`password_hash`/`password_verify`, PASSWORD_DEFAULT) everywhere
- 100% prepared statements; IN-clauses via `ai_in_list()`; zero `->query()` with interpolation
- No `eval`/`shell_exec`/`passthru`/`proc_open`/`unserialize`/`create_function`
- Tokens: `random_bytes(24)`, **hashed at rest** (sha256), expiry, TTL 7d, constant-time `hash_equals` for SERVICE_KEY / tenant keys
- Login lockout (10/15min per email, 40/IP), OTP verify (5/30 in 15min), impersonation admin-only + 30-min TTL + can't impersonate superadmin
- Uploads: extension whitelist, 8MB cap, `bin2hex(random_bytes)` filenames, `move_uploaded_file`
- `client_ip()` trusts REMOTE_ADDR only (no XFF spoofing); `display_errors=0`; WAL + foreign_keys + busy_timeout
- `user_payload` redacts hashes; `mask_secret()` for gateway secrets

### Real gaps fixed
1. **Email header injection (CRLF)** — `smtp_send()`/`mail_fallback()` interpolated `$to`/`$subject`/`$fromName` raw into SMTP DATA headers. User input (`contact` name, `register` name, newsletter email) could inject `\r\nBcc:…`. Fixed: new `mail_hdr($s, $max)` helper strips `\r`/`\n`/`\0` + length-caps; applied at the send boundary in both mail paths. Also strip CR/LF from **stored** contact/register name fields (log-poisoning guard).
2. **Public-endpoint throttling** — `newsletter` (≤6/IP/10min) and `contact` (≤5/IP/10min) were unthrottled and each emails the admin = spam amplifier. Added per-IP caps + `record_attempt` logging.
3. **Inert register cap (real bug)** — register used `recent_fails()` which counts **failed rows only**; register only records successes → the 8/IP/hr cap never fired. New `recent_any()` counts ALL attempts by kind; register now ≤8/IP/hr + ≤4/email/hr (kinds register+resend). `resend-otp` cap similarly made real: ≤3/email/10min.
4. **Security headers** — added `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; sandbox` (JSON API), `X-Permitted-Cross-Domain-Policies: none`, `Cross-Origin-Resource-Policy: cross-origin` (required since ACAO is `*`), `Cache-Control: no-store` (session data).
5. **Expired token pruning** — `app_tokens` grew unbounded; opportunistic prune (1/64 mints) deletes expired rows.
6. **Constant-time `app-setup` key** — was `!==`, now `hash_equals()`.
7. **Body-size cap** — requests > 2MB → 413 before JSON parse (DoS guard).

## Pitfalls hit (worth remembering)
- **`recent_any` with `email_max=0` = always blocked**: `0 >= 0` is true. Non-positive max must mean "no limit" → `($email_max > 0 && $byEmail >= $email_max)`. First test run: 21/26 with all positive-path contact/newsletter tests 429ing.
- **sqlite3 CLI + PHP WAL**: `api_log_hit` shutdown writes can hold the WAL lock; bare `sqlite3 DB "DELETE…"` fails instantly with SQLITE_BUSY **silently** (dbq ignored returncode). Use `sqlite3 -cmd '.timeout 5000'` and check returncode.
- `recent_fails()` (ok=0 only) is NOT suitable for send-caps; it's for brute-force lockouts.

## Tests — `test_security.py` (26/26, wired into run_all)
Headers (7), contact CRLF-sanitized + stored clean, contact length 400, contact throttle 429 (pre-seeded 5 rows — **no SMTP hammering**), newsletter throttle 429 + positive, register CRLF + throttle 429, oversize 413 + normal 200, expired token 401, app-setup wrong key 403, no user enumeration (generic 401), login + app-me still work. Two positive-path tests (newsletter/contact) send 1 real mail each to ADMIN_EMAIL (delivery smoke).

## Verification
- Rig: test_security 26/26; full regression (52 suites) 2935/2935, 0 failed
- Deployed live via `deploy_landing.py` API push; live checks: headers present, wrong app-setup key 403, CRLF contact sanitized, throttles active
- Commit + push to 3 remotes after user confirmation of the pending v20/v21 commit stack

## Round 2 — HTML/static-site audit (same session)
User asked "What about html files?" → audited the ~40 static pages + .htaccess + landing JS.

**Audit findings (mostly clean):** no mixed content (http:// = 0), no exposed sensitive files (.git/.env/config.php/backups all 404 — `api/index.php.bak` 405 is the router, not a file leak), landing JS escapes user input (chat.js `escapeHtml`, tools.js numeric-only, register.js static), robots/sitemap fine. `_headers` file is Netlify-format dead weight on cPanel (harmless).

**Fixed:**
1. **No CSP on HTML pages** — added via `.htaccess` for all non-API responses: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' blob: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` + `X-Permitted-Cross-Domain-Policies: none` + `Cross-Origin-Resource-Policy: same-origin`.
2. **CRITICAL PITFALL — Apache `Header always set` OVERRIDES PHP headers.** First deploy stripped the API's strict `default-src 'none'` + CORP cross-origin (replaced by the loose HTML CSP). Fix: wrap HTML-page headers in `<If "%{REQUEST_URI} !~ m#^/api#">` so PHP's own headers survive. Verify by curl-ing BOTH / and /api/health after any .htaccess change.
3. **Blog article CSP override** — `/blog/<slug>` is PHP-rendered HTML; it sets `text/html` but the API-wide `default-src 'none'` would blank article styling → explicit article CSP override (same as HTML pages).
4. **Reverse tabnabbing** — dashboard NRB listing link `target="_blank"` without rel → `rel="noopener noreferrer"`.
5. **Stale third-party links** — dead `trycloudflare.com` tunnel URLs in ai-caretaker.html + faq.html → live dashboard URL.

**Verification:** live headers (API `default-src 'none'` preserved, HTML pages get full CSP), browser: landing fonts/images load, dashboard login + views + doc viewer path render with **0 console errors / 0 CSP violations**, superadmin.html clean.

## Status
Live-verified. Committed `2759293` (v21 core) + round-2 HTML fixes commit → 3 remotes.
