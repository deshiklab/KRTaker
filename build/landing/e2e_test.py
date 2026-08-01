#!/usr/bin/env python3
"""E2E: register -> read OTP from IMAP -> verify -> check DB."""
import json, time, imaplib, email, re, sqlite3, urllib.request

BASE = 'http://localhost:8878'
EMAIL = 'careers@inceptia.io'
def load_env(path='/root/KRTaker/.env-landing'):
    env = {}
    for line in open(path):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1); env[k] = v
    return env
ENV = load_env()

def post(path, payload):
    req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode(),
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')

# 1) register
st, d = post('/api/register', {'name': 'E2E Test User', 'org': 'Test Org', 'email': EMAIL,
                               'phone': '+880 1712-000001', 'role': 'owner', 'plan': 'Business'})
print('register:', st, d)

# 2) fetch OTP from IMAP
otp = None
for attempt in range(8):
    time.sleep(3)
    try:
        M = imaplib.IMAP4_SSL('mail.inceptia.io', 993)
        M.login(ENV['SMTP_USER'], ENV['SMTP_PASS'])
        M.select('INBOX')
        typ, data = M.search(None, '(FROM "careers@inceptia.io" SUBJECT "verification code" UNSEEN)')
        ids = data[0].split()
        if ids:
            typ, msg = M.fetch(ids[-1], '(RFC822)')
            raw = msg[0][1]
            m = re.search(r'(\d{6})', email.message_from_bytes(raw).get_payload(decode=True).decode(errors='ignore'))
            otp = m.group(1) if m else None
            M.store(ids[-1], '+FLAGS', '\\Seen')
        M.logout()
        if otp: break
    except Exception as e:
        print('imap attempt err:', repr(e))
print('otp fetched:', otp)

# 3) verify
st, d = post('/api/verify-otp', {'email': EMAIL, 'otp': otp})
print('verify:', st, d)

# 4) check DB
con = sqlite3.connect('/root/KRTaker/landing.db')
con.row_factory = sqlite3.Row
row = con.execute('SELECT name, email, role, plan, status, trial_end, verified_at FROM subscribers WHERE email=?', (EMAIL,)).fetchone()
print('DB row:', dict(row) if row else None)
