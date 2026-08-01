# krtaker.com deployment (cPanel / shared hosting)

Live site: https://krtaker.com (IP 37.27.134.21, cPanel)

## What's here
- `api.php` — PHP 8.1 port of the landing API (register / verify-otp / resend-otp /
  newsletter / contact). SQLite at `/home/krtaker/krtaker_landing.db` (outside webroot).
  **Email**: tries direct SMTP (mail.inceptia.io:587) first, falls back to PHP `mail()`
  (host local Exim) — SMTP is refused from shared-hosting IPs, mail() works (MX + SPF
  both point at the host).
- `htaccess.example` — live `.htaccess`: force HTTPS, pretty URLs (`.html`), `/api/*`
  rewrite to `api/index.php`, security headers, cache rules.

## How to deploy (from repo root)
1. `python3 build/landing/build.py` → produces `web/` (static site)
2. Upload `web/` contents + `deploy/api.php` (as `api/index.php`) + `deploy/htaccess.example`
   (as `.htaccess`) to `/home/krtaker/public_html` (FTP or cPanel File Manager)
3. Verify: `curl https://krtaker.com/api/health` → `{"ok":true,...}`

## Notes
- No Python on this host → PHP only. SQLite matches landing.db design; no MySQL grants needed.
- 1GB quota — keep server-side lean (no backups on server; they live in git).
- SMTP from this shared IP gets 535 (anti-spam); mail() via local Exim is the reliable path.
