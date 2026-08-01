#!/usr/bin/env python3
"""Browser E2E: drive register wizard, inject known OTP, verify success. Capture shots."""
from playwright.sync_api import sync_playwright
import sqlite3, hashlib, time
from datetime import datetime, timedelta

URL = 'https://servers-diagnostic-kirk-jeremy.trycloudflare.com/landing/register.html'
EMAIL = 'uiwizard@testmail.krtaker.com'

def seed_otp(email, otp='123456'):
    con = sqlite3.connect('/root/KRTaker/landing.db')
    expires = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    con.execute('UPDATE subscribers SET otp_hash=?, otp_expires=? WHERE email=?',
                (hashlib.sha256(otp.encode()).hexdigest(), expires, email))
    con.commit()
    print('seeded otp for', email)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 1280, 'height': 900})
    errs = []
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(URL, wait_until='networkidle')
    page.wait_for_timeout(1200)

    # Step 1: pick Business plan
    page.click('.plan-card[data-plan="Business"]')
    page.screenshot(path='/tmp/wiz_step1.png')
    page.click('#goStep2')
    page.wait_for_timeout(400)
    # Step 2: owner already selected
    page.screenshot(path='/tmp/wiz_step2.png')
    page.click('#goStep3')
    page.wait_for_timeout(400)
    # Step 3: fill account
    page.fill('#rName', 'UI Wizard Test')
    page.fill('#rOrg', 'Test Residency')
    page.fill('#rEmail', EMAIL)
    page.fill('#rPhone', '+880 1712-345678')
    page.fill('#rPass', 'secret123')
    page.screenshot(path='/tmp/wiz_step3.png')
    page.click('#regSubmit')
    page.wait_for_timeout(2500)  # let fetch + email attempt finish
    # Step 4 visible?
    pane4 = page.evaluate("document.getElementById('pane4').classList.contains('active')")
    otpEmail = page.evaluate("document.getElementById('otpEmail').textContent")
    print('step4 visible:', pane4, '| otp email shown:', otpEmail)

    # Seed the OTP directly in DB (API emails a real OTP we can't read for this mailbox)
    seed_otp(EMAIL, '123456')
    page.wait_for_timeout(300)
    page.screenshot(path='/tmp/wiz_step4.png')
    # enter OTP
    inputs = page.query_selector_all('#otpRow input')
    for i, d in enumerate('123456'):
        inputs[i].fill(d)
    page.click('#otpVerify')
    page.wait_for_timeout(2000)
    step5 = page.evaluate("document.getElementById('pane5').classList.contains('active')")
    print('step5 success visible:', step5)
    page.screenshot(path='/tmp/wiz_step5.png')

    # Dark mode shot on home
    page.goto(URL.replace('register.html', ''), wait_until='networkidle')
    page.click('[data-theme-toggle]')
    page.wait_for_timeout(600)
    page.screenshot(path='/tmp/home_dark.png')

    # Bengali home
    page.evaluate("krSetLang('bn')")
    page.wait_for_timeout(500)
    page.screenshot(path='/tmp/home_bn.png')

    # Mobile register
    mp = b.new_page(viewport={'width': 390, 'height': 844})
    mp.goto(URL, wait_until='networkidle')
    mp.wait_for_timeout(1000)
    mp.screenshot(path='/tmp/wiz_mobile.png')
    mp.close()

    print('JS errors:', errs if errs else 'NONE')
    b.close()
