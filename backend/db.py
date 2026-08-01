"""REM ERP Backend — SQLite schema + connection helper."""
import sqlite3, os, json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rem_erp.db')

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Super Admin', dept TEXT, status TEXT DEFAULT 'Active',
  last_login TEXT
);
CREATE TABLE IF NOT EXISTS leads(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT,
  property TEXT, status TEXT DEFAULT 'New Inquiry', priority TEXT DEFAULT 'Medium',
  type TEXT DEFAULT 'Local', source TEXT, value INTEGER DEFAULT 0,
  owner TEXT DEFAULT 'Unassigned', next_follow_up TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS customers(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT,
  property TEXT, type TEXT DEFAULT 'Booking', status TEXT DEFAULT 'Active',
  dues_num INTEGER DEFAULT 0, project TEXT
);
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT, location TEXT,
  status TEXT DEFAULT 'Planning', progress INTEGER DEFAULT 0,
  budget INTEGER DEFAULT 0, manager TEXT, type TEXT DEFAULT 'land',
  plots INTEGER DEFAULT 0, units INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bookings(
  id TEXT PRIMARY KEY, client TEXT, property TEXT, unit TEXT,
  price INTEGER DEFAULT 0, advance INTEGER DEFAULT 0, status TEXT DEFAULT 'Pending Review',
  type TEXT DEFAULT 'Flat', terms TEXT, sched_start TEXT, date TEXT
);
CREATE TABLE IF NOT EXISTS invoices(
  id TEXT PRIMARY KEY, client TEXT, project TEXT, unit TEXT,
  amount INTEGER DEFAULT 0, vat_rate INTEGER DEFAULT 0, tds_rate INTEGER DEFAULT 0,
  ait_rate INTEGER DEFAULT 0, vat INTEGER DEFAULT 0, tds INTEGER DEFAULT 0,
  ait INTEGER DEFAULT 0, net INTEGER DEFAULT 0, challan TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft', due_date TEXT, issued_date TEXT, desc TEXT,
  type TEXT DEFAULT 'Sales'
);
CREATE TABLE IF NOT EXISTS payments(
  id TEXT PRIMARY KEY, invoice_id TEXT, client TEXT, amount INTEGER DEFAULT 0,
  date TEXT, method TEXT DEFAULT 'Bank Transfer', reference TEXT, status TEXT DEFAULT 'Pending', notes TEXT
);
CREATE TABLE IF NOT EXISTS dues(
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT, project TEXT, unit TEXT,
  total_price INTEGER DEFAULT 0, paid INTEGER DEFAULT 0, due INTEGER DEFAULT 0,
  due_date TEXT, status TEXT DEFAULT 'Upcoming', bucket TEXT DEFAULT 'Future',
  days_overdue INTEGER DEFAULT 0, phone TEXT
);
CREATE TABLE IF NOT EXISTS transactions(
  id TEXT PRIMARY KEY, date TEXT, desc TEXT, client TEXT, project TEXT,
  type TEXT DEFAULT 'Inflow', category TEXT, status TEXT DEFAULT 'Received', amount INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS activity_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, user TEXT,
  action TEXT, module TEXT, entity TEXT, entity_id TEXT, details TEXT
);
CREATE TABLE IF NOT EXISTS fixed_assets(
  id TEXT PRIMARY KEY, code TEXT, name TEXT, category TEXT, purchase_date TEXT,
  cost INTEGER DEFAULT 0, salvage INTEGER DEFAULT 0, useful_life INTEGER DEFAULT 0,
  accum_dep INTEGER DEFAULT 0, location TEXT, status TEXT DEFAULT 'In Use'
);
CREATE TABLE IF NOT EXISTS license(
  id INTEGER PRIMARY KEY CHECK (id = 1), status TEXT DEFAULT 'Active',
  contract INTEGER DEFAULT 800000, installments TEXT, checklist TEXT
);
CREATE TABLE IF NOT EXISTS doc_store(
  collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
  updated_at TEXT, PRIMARY KEY(collection, id)
);
CREATE TABLE IF NOT EXISTS api_tokens(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT
);
CREATE TABLE IF NOT EXISTS portal_users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, phone TEXT DEFAULT '', password_hash TEXT NOT NULL,
  enabled INTEGER DEFAULT 1, last_login TEXT
);
CREATE TABLE IF NOT EXISTS portal_tokens(
  token TEXT PRIMARY KEY, email TEXT NOT NULL, created_at TEXT
);
CREATE TABLE IF NOT EXISTS payment_intents(
  token TEXT PRIMARY KEY, email TEXT NOT NULL, invoice_id TEXT,
  amount INTEGER DEFAULT 0, method TEXT DEFAULT 'bKash',
  status TEXT DEFAULT 'pending', gateway_ref TEXT DEFAULT '', created_at TEXT, completed_at TEXT
);
"""

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()

def row_to_dict(row):
    return dict(row) if row is not None else None

def rows_to_dicts(rows):
    return [dict(r) for r in rows]

def log_activity(user, action, module, entity, entity_id, details=''):
    conn = get_db()
    conn.execute("INSERT INTO activity_log(timestamp,user,action,module,entity,entity_id,details) VALUES(?,?,?,?,?,?,?)",
                 (__import__('datetime').datetime.utcnow().isoformat() + 'Z', user, action, module, entity, entity_id, details))
    conn.commit(); conn.close()
