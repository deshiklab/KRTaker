#!/usr/bin/env python3
"""Test SMTP login on mail.inceptia.io (no send)."""
import smtplib, sys

def load_env(path='/root/KRTaker/.env-landing'):
    env = {}
    for line in open(path):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k] = v
    return env

env = load_env()
try:
    s = smtplib.SMTP(env['SMTP_HOST'], int(env['SMTP_PORT']), timeout=15)
    s.ehlo()
    if s.has_extn('STARTTLS'):
        s.starttls()
        s.ehlo()
    s.login(env['SMTP_USER'], env['SMTP_PASS'])
    print('SMTP LOGIN OK —', env['SMTP_HOST'], env['SMTP_PORT'])
    s.quit()
except Exception as e:
    print('SMTP FAIL:', repr(e))
    sys.exit(1)
