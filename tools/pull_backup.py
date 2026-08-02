#!/usr/bin/env python3
"""Pull a full KRTaker DB snapshot (SQLite binary) + JSON export from prod via
the Phase-6 superadmin endpoints, verify integrity, store under
/root/krtaker-backup/phase7-pre/. Usage: python3 pull_backup.py"""
import json, os, sqlite3, subprocess, sys, urllib.request, urllib.error
from datetime import datetime

BASE = 'https://krtaker.com/api'
OUT = '/root/krtaker-backup/phase7-pre'
os.makedirs(OUT, exist_ok=True)
ts = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

def call(action, payload=None, token=None, method='POST'):
    url = f'{BASE}/{action}'
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if token: req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

# login as superadmin
s, b = call('app-login', {'email': 'kabir@krtaker.com', 'password': 'demo123'})
j = json.loads(b)
assert j.get('ok'), f'login failed: {b[:200]}'
tok = j['token']
print('superadmin login: OK')

# 1) SQLite snapshot
s, b = call('app-backup', token=tok, method='GET')
assert s == 200 and b[:5] != b'{"ok"', f'backup failed: {s} {b[:120]}'
db_path = f'{OUT}/krtaker_db_{ts}.db'
open(db_path, 'wb').write(b)
print(f'1) DB snapshot: {len(b):,} bytes -> {db_path}')

# 2) JSON export
s, b = call('app-export', token=tok, method='GET')
assert s == 200, f'export failed: {s}'
exp = json.loads(b)
exp_path = f'{OUT}/krtaker_export_{ts}.json'
open(exp_path, 'w').write(json.dumps(exp, indent=1))
print(f'2) JSON export: {len(b):,} bytes -> {exp_path} ({len(exp["_tables"])} tables)')

# 3) verify snapshot with sqlite3
c = sqlite3.connect(db_path)
c.execute('PRAGMA quick_check')
assert c.execute('PRAGMA quick_check').fetchone()[0] == 'ok', 'quick_check FAILED'
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")]
rows = {}
for t in tables:
    rows[t] = c.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
c.close()
print(f'3) snapshot verify: integrity ok | {len(tables)} tables')
for t in ['subscribers','properties','units','tenants','leases','invoices','payments','tickets','app_users','audit_log','auth_attempts','legal_docs']:
    print(f'   {t}: {rows.get(t, 0)}')

# 4) cross-check export counts vs snapshot
bad = [t for t in ['subscribers','properties','units','invoices','payments','tickets','app_users'] if len(exp['_tables'].get(t, [])) != rows.get(t, 0)]
print('4) export/snapshot cross-check:', 'MATCH' if not bad else f'MISMATCH {bad}')

# manifest
with open(f'{OUT}/MANIFEST_{ts}.txt', 'w') as f:
    f.write(f'krtaker backup {ts} (pre Phase 7)\n')
    f.write(f'db:  {db_path} ({len(b) if False else os.path.getsize(db_path)} bytes)\n')
    f.write(f'exp: {exp_path}\n')
    for t, n in sorted(rows.items()):
        f.write(f'  {t}: {n}\n')
print('manifest written. BACKUP OK')
