# Phase 7 — Deploy: PostgreSQL + backend on the Lightsail VPS

**Status: runbook validated locally (this machine). VPS execution blocked on SSH
access to `18.142.98.150` (existing keys denied) — see "Blocker" at the bottom.**

## What was proven on this box (2026-08-02)
- PostgreSQL 14 installed locally; `docs/pg-migration.sql` applies clean (all
  23 tables + indexes + RLS policies + grants).
- `tools/pg_import.py` imported the real production export (23/23 tables,
  `--owner-id 8`, idempotent).
- **RLS verified end-to-end**:
  - `krtaker_app` + `app.current_tenant='8'` → sees only org 8 rows (6 properties)
  - `app.current_tenant='12'` → sees only org 12 rows (1 property)
  - cross-org `INSERT` → rejected by `WITH CHECK` (`new row violates row-level security policy`)
  - `krtaker_staff` (`BYPASSRLS`) → sees all rows (7 properties)
- Verified snapshot artifact: `/root/krtaker-backup/phase7-pre/krtaker_pg_dump_*.sql`
  (pg_dump of the migrated DB — restore target for the VPS).

## Why not on cPanel
Shared cPanel ships `pdo_pgsql` but runs **no PostgreSQL server** (probe:
5432 connection refused). PG is a VPS capability.

## Runbook (executor: root on 18.142.98.150)

### 1. PostgreSQL
```bash
apt-get install -y postgresql postgresql-client   # PG 14+ on Ubuntu 22.04
systemctl enable --now postgresql
su - postgres -c "psql -c \"CREATE USER krtaker LOGIN PASSWORD '<strong>'\"
su - postgres -c "psql -c 'CREATE DATABASE krtaker OWNER krtaker'"
```
`pg_hba.conf`: allow `127.0.0.1/32` scram-sha-256 for krtaker (app connects
locally through nginx → no public 5432 exposure).

### 2. Restore the migrated snapshot
```bash
# copy /root/krtaker-backup/phase7-pre/krtaker_pg_dump_*.sql to the VPS
su - postgres -c "psql -d krtaker -v ON_ERROR_STOP=1 -f /tmp/krtaker_pg_dump.sql"
su - postgres -c "psql -d krtaker -c \"ALTER ROLE krtaker_staff BYPASSRLS\""
```
(The dump includes tables, RLS policies, and data; roles `krtaker_app` /
`krtaker_staff` are recreated by the embedded `CREATE ROLE` blocks.)

### 3. Backend (gunicorn + systemd) — REM recipe
`/etc/systemd/system/krtaker-backend.service`:
```ini
[Unit]
Description=KRTaker Backend (gunicorn)
After=network.target postgresql.service
[Service]
Type=simple
WorkingDirectory=/root/KRTaker/backend
ExecStart=/root/KRTaker/backend/venv/bin/gunicorn -w 3 -b 127.0.0.1:5002 --timeout 120 --access-logfile - --error-logfile - app:app
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1
Environment=KRT_DS_KEY=
[Install]
WantedBy=multi-user.target
```
Stage files in /tmp, `cp` into /etc, `daemon-reload`, `enable --now`.

### 4. nginx reverse proxy + certbot (proven sslip.io trick)
```nginx
server {
    listen 80; listen [::]:80;
    server_name krtaker.18.142.98.150.sslip.io app.18.142.98.150.sslip.io;
    client_max_body_size 20M;
    location / { proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1; proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme; proxy_read_timeout 120s; }
}
```
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d krtaker.18.142.98.150.sslip.io -d app.18.142.98.150.sslip.io \
  --non-interactive --agree-tos -m kabir.swe@gmail.com --redirect
```
Cert issuance needs only port 80 public; HTTPS works the moment Lightsail
TCP 443 is opened in the console (user action, like REM).

### 5. PG connection hygiene (RLS backstop)
Every pooled connection: clear tenant first, then set after auth:
```sql
SELECT set_config('app.current_tenant', '0', false);
-- ...auth check resolves owner_id from subscribers/app_users...
SELECT set_config('app.current_tenant', :ownerId, false);
```
API keeps explicit `WHERE owner_id = ?` as the primary filter; RLS is the
backstop. Tenant/partner sub-logins narrow further via `sub_email`/`con`.

### 6. Verification
```bash
curl -s -X POST http://127.0.0.1:5002/api/app-login -H 'Content-Type: application/json' \
  -d '{"email":"owner@krtaker.com","password":"..."}'
curl -s -o /dev/null -w "%{http_code}" --resolve krtaker.18.142.98.150.sslip.io:443:127.0.0.1 \
  https://krtaker.18.142.98.150.sslip.io/api/app-login
su - postgres -c "psql -d krtaker -c \"SET ROLE krtaker_app; SET app.current_tenant='8'; SELECT count(*) FROM properties;\""
```

## Blocker
SSH to `18.142.98.150` is denied for `root`/`ubuntu` with every key on this box
(`id_ed25519`, `krtaker_deshiklab`). To execute this runbook remotely:
- Add this machine's pubkey to the Lightsail instance:
  `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOvM3PgM6KswJarvNTulcehiC7Py7cEsQrVOBQ0n3IGT hermes-agent-kabir`
  (Lightsail console → instance → SSH key pair / `~/.ssh/authorized_keys`), or
- Provide the Lightsail keypair `.pem` used at deploy time.

## Already live regardless of VPS
- **Daily DB backup** (cron `934e56ba8240`, 00:00 UTC): `app-backup` snapshot +
  `app-export` JSON pulled from krtaker.com → `/root/krtaker-backup/auto/<ts>/`,
  14-day rotation, silent-on-success / alerts-on-failure.
- cPanel app keeps running on SQLite (WAL, hardened) — no downtime risk.
