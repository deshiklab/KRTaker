#!/usr/bin/env python3
"""Capture persona-specific hero screenshots from the KRTaker PWA."""
from playwright.sync_api import sync_playwright
import json

URL = 'file:///root/KRTaker/docs/design-prototype.html'

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for role, out in [('tenant', '/tmp/kr_tenant_desktop.png'), ('owner', '/tmp/kr_owner_desktop.png')]:
        page = b.new_page(viewport={'width': 1280, 'height': 860})
        page.goto(URL, wait_until='load')
        page.wait_for_timeout(2500)
        try:
            page.evaluate(f"switchRole('{role}')")
            page.wait_for_timeout(1800)
            cur = page.evaluate("roleOf()")
            print(role, '->', cur)
        except Exception as e:
            print(role, 'switch err:', repr(e))
        page.screenshot(path=out)
        print('saved', out)
        page.close()
    b.close()
