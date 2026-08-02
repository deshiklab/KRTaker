#!/usr/bin/env python3
"""Import a KRTaker app-export JSON (from cPanel GET /api/app-export) into
PostgreSQL (Phase 6/7 migration). Idempotent: uses ON CONFLICT DO NOTHING for
PK tables, TRUNCATE-free (safe to re-run).

Usage:
    python3 tools/pg_import.py export.json --dsn "postgresql://krtaker@localhost/krtaker" [--owner-id 1] [--drop]

Tables WITHOUT owner_id (platform/landing) are inserted as-is. Tenant tables
are stamped with --owner-id (default 1 = platform org) unless the export rows
already carry owner_id (future multi-org exports).
"""
import argparse, json, sys
from datetime import datetime

TENANT_TABLES = ['properties','units','tenants','leases','invoices','receipts',
                 'payments','tickets','partners','staff','support','cases','gateway_tx']
PLATFORM_TABLES = ['subscribers','contacts','newsletter_emails','app_users',
                   'app_tokens','plan_catalog','audit_log','auth_attempts',
                   'platform_meta','legal_docs','ai_log']

def adapt(val):
    if val is None: return None
    if isinstance(val, bool): return val
    if isinstance(val, (int, float)): return val
    s = str(val)
    if s == '': return None
    # SQLite datetime('now') / gmdate formats → PG timestamptz where sensible
    try:
        if s.endswith('Z') or ('T' in s and len(s) >= 19):
            return s.replace(' ', 'T') if 'T' not in s else s
    except Exception: pass
    return s

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('export_json')
    ap.add_argument('--dsn', required=True)
    ap.add_argument('--owner-id', type=int, default=1, help='owner_id stamp for tenant tables')
    ap.add_argument('--drop', action='store_true', help='DROP existing tables first (fresh import)')
    args = ap.parse_args()

    try:
        import psycopg
        from psycopg import sql
    except ImportError:
        print('pip install psycopg[binary]', file=sys.stderr); sys.exit(1)

    data = json.load(open(args.export_json))
    tables = data.get('_tables', {})
    print(f'export: {data.get("_exported_at")} | {len(tables)} tables')

    with psycopg.connect(args.dsn, autocommit=False) as conn:
        cur = conn.cursor()
        for t in PLATFORM_TABLES:
            rows = tables.get(t) or []
            if not rows: continue
            if args.drop:
                cur.execute(f'DROP TABLE IF EXISTS {t} CASCADE')
                conn.commit()
            cols = list(rows[0].keys())
            if t in ('plan_catalog',) and 'features' in cols and isinstance(rows[0]['features'], str):
                for r in rows:
                    try:
                        r['features'] = json.dumps(json.loads(r['features']))  # JSON string for JSONB
                    except Exception: pass
            placeholders = ','.join(['%s'] * len(cols))
            conflict = ', '.join([c for c in cols if c in ('id','token','code','email','k')])
            if not conflict: conflict = 'id'
            idents = [sql.Identifier(c) for c in cols]
            cident = sql.Identifier(conflict.split(',')[0].strip()) if ',' not in conflict else None
            if cident:
                upsert = sql.SQL('INSERT INTO {} ({}) VALUES ({}) ON CONFLICT ({}) DO NOTHING').format(
                    sql.Identifier(t), sql.SQL(', ').join(idents),
                    sql.SQL(', ').join([sql.Placeholder()] * len(cols)), cident)
            else:
                upsert = sql.SQL('INSERT INTO {} ({}) VALUES ({})').format(
                    sql.Identifier(t), sql.SQL(', ').join(idents),
                    sql.SQL(', ').join([sql.Placeholder()] * len(cols)))
            n = 0
            for r in rows:
                try:
                    cur.execute(upsert, [adapt(r.get(c)) for c in cols]); n += 1
                except Exception as e:
                    print(f'  ! {t}: {e} (row {r.get("id", r.get("email", "?"))})')
            conn.commit()
            print(f'  {t}: {n}/{len(rows)}')

        for t in TENANT_TABLES:
            rows = tables.get(t) or []
            if not rows: continue
            if args.drop:
                cur.execute(f'DROP TABLE IF EXISTS {t} CASCADE')
                conn.commit()
            cols = list(rows[0].keys())
            if 'owner_id' not in cols:
                cols = ['owner_id'] + cols
            placeholders = ','.join(['%s'] * len(cols))
            idents = [sql.Identifier(c) for c in cols]
            upsert = sql.SQL('INSERT INTO {} ({}) VALUES ({}) ON CONFLICT (id) DO NOTHING').format(
                sql.Identifier(t), sql.SQL(', ').join(idents),
                sql.SQL(', ').join([sql.Placeholder()] * len(cols)))
            n = 0
            for r in rows:
                vals = [args.owner_id] + [adapt(r.get(c)) for c in cols[1:]]
                try:
                    cur.execute(upsert, vals); n += 1
                except Exception as e:
                    print(f'  ! {t}: {e} (row {r.get("id", "?")})')
            conn.commit()
            print(f'  {t}: {n}/{len(rows)} (owner_id={args.owner_id})')

    print('import complete')

if __name__ == '__main__':
    main()
