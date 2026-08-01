#!/usr/bin/env python3
"""KRTaker landing API + static server.
Serves:  /          -> docs/   (PWA prototype)
         /landing/* -> web/    (landing site)
         /api/*     -> register/OTP/contact endpoints
Run: python3 landing_api.py [port]   (default 8878)
"""
import os, re, sqlite3, hashlib, secrets, smtplib, html
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_from_directory, abort

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, 'docs')
WEB = os.path.join(ROOT, 'web')
DB = os.path.join(ROOT, 'landing.db')

app = Flask(__name__, static_folder=None)

# ---------- env ----------
def load_env(path):
    env = {}
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k] = v
    return env

ENV = load_env(os.path.join(ROOT, '.env-landing'))
SMTP = {
    'host': ENV.get('SMTP_HOST', 'mail.inceptia.io'),
    'port': int(ENV.get('SMTP_PORT', 587)),
    'user': ENV.get('SMTP_USER', ''),
    'pass': ENV.get('SMTP_PASS', ''),
    'from': ENV.get('MAIL_FROM', ENV.get('SMTP_USER', '')),
}
ADMIN_EMAIL = ENV.get('ADMIN_EMAIL', 'kabir.swe@gmail.com')
TRIAL_DAYS = 14

# ---------- db ----------
def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute('''CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, org TEXT DEFAULT '', email TEXT UNIQUE NOT NULL,
        phone TEXT DEFAULT '', role TEXT DEFAULT 'owner', plan TEXT DEFAULT 'Starter',
        status TEXT DEFAULT 'pending', trial_end TEXT, otp_hash TEXT, otp_expires TEXT,
        created_at TEXT DEFAULT (datetime('now')), verified_at TEXT)''')
    con.execute('''CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT,
        subject TEXT, message TEXT, created_at TEXT DEFAULT (datetime('now')))''')
    con.execute('''CREATE TABLE IF NOT EXISTS newsletter_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now')))''')
    return con

# ---------- email ----------
def send_mail(to, subject, body_html, body_text=None):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP['from']
    msg['To'] = to
    msg.attach(MIMEText(body_text or re.sub(r'<[^>]+>', '', body_html), 'plain'))
    msg.attach(MIMEText(body_html, 'html'))
    try:
        s = smtplib.SMTP(SMTP['host'], SMTP['port'], timeout=20)
        s.ehlo()
        if s.has_extn('STARTTLS'):
            s.starttls(); s.ehlo()
        if SMTP['user']:
            s.login(SMTP['user'], SMTP['pass'])
        s.sendmail(SMTP['from'], [to], msg.as_string())
        s.quit()
        return True
    except Exception as e:
        print('MAIL FAIL:', repr(e), flush=True)
        return False

def otp_email_html(code, name):
    return f'''<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">
<h2 style="margin:0 0 6px;color:#1A2433">KRTaker — verify your email</h2>
<p style="color:#5B6B83;font-size:14px">Hi {html.escape(name)}, your one-time verification code:</p>
<div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#2F80ED;padding:14px;background:#F6F9FE;border-radius:12px;text-align:center;margin:14px 0">{code}</div>
<p style="color:#8A97AB;font-size:12.5px">The code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
<p style="color:#8A97AB;font-size:12px;border-top:1px solid #E4EAF3;padding-top:12px">KRTaker · Key Responsibility Taker · Dhaka, Bangladesh</p>
</div>'''

def welcome_email_html(name, trial_end):
    return f'''<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">
<h2 style="margin:0 0 6px;color:#1A2433">Welcome to KRTaker 🎉</h2>
<p style="color:#5B6B83;font-size:14px">Hi {html.escape(name)}, your 14-day free trial is live until <b>{html.escape(trial_end)}</b>.</p>
<p style="color:#5B6B83;font-size:14px">Next step: log in, add your first property, and let the AI caretaker take over.</p>
<p style="margin:18px 0"><a href="https://krtaker.com/landing/login.html" style="background:#2F80ED;color:#fff;padding:12px 26px;border-radius:12px;text-decoration:none;font-weight:700">Open your workspace</a></p>
<p style="color:#8A97AB;font-size:12px">Questions? Reply to this email — we reply within 24 hours.</p>
</div>'''

def contact_email_html(c):
    return f'''<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #E4EAF3;border-radius:16px">
<h2 style="margin:0 0 10px;color:#1A2433">New contact message</h2>
<p style="color:#5B6B83;font-size:14px"><b>Name:</b> {html.escape(c.get('name',''))}<br>
<b>Email:</b> {html.escape(c.get('email',''))}<br>
<b>Phone:</b> {html.escape(c.get('phone','')) or '—'}<br>
<b>Topic:</b> {html.escape(c.get('subject','')) or '—'}</p>
<div style="background:#F6F9FE;border-radius:12px;padding:16px;font-size:14px;color:#1A2433;white-space:pre-wrap">{html.escape(c.get('message',''))}</div>
</div>'''

# ---------- api ----------
@app.route('/api/health')
def health():
    return jsonify(ok=True, service='krtaker-landing')

@app.route('/api/register', methods=['POST'])
def register():
    d = request.get_json(silent=True) or {}
    name = (d.get('name') or '').strip()
    email = (d.get('email') or '').strip().lower()
    if not name or not re.match(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        return jsonify(ok=False, error='Invalid name or email.'), 400
    con = db()
    row = con.execute('SELECT * FROM subscribers WHERE email=?', (email,)).fetchone()
    if row and row['status'] == 'active':
        return jsonify(ok=False, error='This email is already registered. Please log in.'), 409
    otp = f'{secrets.randbelow(1000000):06d}'
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    trial_end = (datetime.utcnow() + timedelta(days=TRIAL_DAYS)).strftime('%d %b %Y')
    if row:
        con.execute('UPDATE subscribers SET name=?, org=?, phone=?, role=?, plan=?, otp_hash=?, otp_expires=?, status="pending" WHERE email=?',
                    (name, d.get('org',''), d.get('phone',''), d.get('role','owner'), d.get('plan','Starter'), otp_hash, expires, email))
    else:
        con.execute('INSERT INTO subscribers (name, org, email, phone, role, plan, status, trial_end, otp_hash, otp_expires) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    (name, d.get('org',''), email, d.get('phone',''), d.get('role','owner'), d.get('plan','Starter'), 'pending', trial_end, otp_hash, expires))
    con.commit()
    ok = send_mail(email, 'Your KRTaker verification code', otp_email_html(otp, name))
    return jsonify(ok=True, otp_sent=ok, trial_days=TRIAL_DAYS)

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    d = request.get_json(silent=True) or {}
    email = (d.get('email') or '').strip().lower()
    otp = (d.get('otp') or '').strip()
    con = db()
    row = con.execute('SELECT * FROM subscribers WHERE email=?', (email,)).fetchone()
    if not row:
        return jsonify(ok=False, error='No registration found for this email.'), 404
    now = datetime.utcnow().isoformat()
    if not row['otp_hash'] or row['otp_expires'] < now:
        return jsonify(ok=False, error='Code expired. Resend a new one.'), 400
    if hashlib.sha256(otp.encode()).hexdigest() != row['otp_hash']:
        return jsonify(ok=False, error='Invalid code.'), 400
    trial_end = row['trial_end'] or (datetime.utcnow() + timedelta(days=TRIAL_DAYS)).strftime('%d %b %Y')
    con.execute('UPDATE subscribers SET status="active", otp_hash=NULL, verified_at=? WHERE id=?', (now, row['id']))
    con.commit()
    send_mail(email, 'Welcome to KRTaker 🎉', welcome_email_html(row['name'], trial_end))
    return jsonify(ok=True, trial_end=trial_end, trial_days=TRIAL_DAYS)

@app.route('/api/resend-otp', methods=['POST'])
def resend_otp():
    d = request.get_json(silent=True) or {}
    email = (d.get('email') or '').strip().lower()
    con = db()
    row = con.execute('SELECT * FROM subscribers WHERE email=?', (email,)).fetchone()
    if not row:
        return jsonify(ok=False, error='No registration found for this email.'), 404
    if row['status'] == 'active':
        return jsonify(ok=False, error='Account already verified.'), 409
    otp = f'{secrets.randbelow(1000000):06d}'
    expires = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    con.execute('UPDATE subscribers SET otp_hash=?, otp_expires=? WHERE id=?',
                (hashlib.sha256(otp.encode()).hexdigest(), expires, row['id']))
    con.commit()
    ok = send_mail(email, 'Your KRTaker verification code', otp_email_html(otp, row['name']))
    return jsonify(ok=True, otp_sent=ok)

@app.route('/api/newsletter', methods=['POST'])
def newsletter():
    d = request.get_json(silent=True) or {}
    email = (d.get('email') or '').strip().lower()
    if not re.match(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        return jsonify(ok=False, error='Invalid email.'), 400
    con = db()
    try:
        con.execute('INSERT INTO newsletter_emails (email) VALUES (?)', (email,))
        con.commit()
    except sqlite3.IntegrityError:
        return jsonify(ok=True, already=True)
    send_mail(ADMIN_EMAIL, f'[KRTaker] Newsletter signup: {email}',
              f'<p>New newsletter subscriber: <b>{html.escape(email)}</b></p>')
    return jsonify(ok=True)

@app.route('/api/contact', methods=['POST'])
def contact():
    d = request.get_json(silent=True) or {}
    name = (d.get('name') or '').strip()
    email = (d.get('email') or '').strip()
    msg = (d.get('message') or '').strip()
    if not name or not email or not msg:
        return jsonify(ok=False, error='Name, email and message are required.'), 400
    con = db()
    con.execute('INSERT INTO contacts (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
                (name, email, d.get('phone',''), d.get('subject',''), msg))
    con.commit()
    send_mail(ADMIN_EMAIL, f'[KRTaker] Contact: {name}', contact_email_html(d))
    return jsonify(ok=True)

# ---------- static ----------
@app.route('/landing/')
@app.route('/landing/<path:filename>')
def landing(filename='index.html'):
    path = os.path.normpath(os.path.join(WEB, filename))
    if not path.startswith(WEB):
        abort(404)
    if os.path.isdir(path):
        path = os.path.join(path, 'index.html')
    if os.path.exists(path):
        return send_from_directory(WEB, os.path.relpath(path, WEB))
    abort(404)

@app.route('/favicon.ico')
@app.route('/landing/favicon.ico')
def favicon():
    return send_from_directory(DOCS, os.path.join('pwa', 'icon.svg'))

@app.route('/')
def root():
    return send_from_directory(DOCS, 'index.html')

@app.route('/<path:filename>')
def docs_files(filename):
    path = os.path.normpath(os.path.join(DOCS, filename))
    if not path.startswith(DOCS):
        abort(404)
    if os.path.exists(path) and os.path.isfile(path):
        return send_from_directory(DOCS, filename)
    abort(404)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8878'))
    print(f'KRTaker landing API on :{port} (SMTP={"OK" if SMTP["user"] else "unset"})', flush=True)
    app.run(host='0.0.0.0', port=port, threaded=True)
