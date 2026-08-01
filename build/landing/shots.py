#!/usr/bin/env python3
"""Inspect KRTaker PWA persona mechanism + capture hero screenshots."""
from playwright.sync_api import sync_playwright
import json, sys

URL = 'file:///root/KRTaker/docs/design-prototype.html'

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 1280, 'height': 860})
    page.goto(URL, wait_until='load')
    page.wait_for_timeout(3500)

    info = page.evaluate("""() => {
      const out = {};
      try {
        const keys = Object.keys(localStorage);
        out.lsKeys = keys;
        out.ls = {};
        keys.forEach(k => { const v = localStorage.getItem(k); out.ls[k] = v ? v.slice(0, 300) : v; });
      } catch(e) { out.lsErr = String(e); }
      out.globals = Object.keys(window).filter(k => /kr|KRT|__|persona|role|db/i.test(k)).slice(0, 40);
      out.bodyText = document.body.innerText.slice(0, 400);
      out.dbKeys = {};
      try {
        ['krtaker_db', 'krtaker_db_v3', 'krtaker_persona', 'krtaker_active_user'].forEach(k => {
          const v = localStorage.getItem(k); if (v) out.dbKeys[k] = v.slice(0, 200);
        });
      } catch(e) {}
      return out;
    }""")
    print(json.dumps(info, indent=1)[:3000])

    # Screenshot default dashboard (desktop)
    page.screenshot(path='/tmp/kr_dash_desktop.png')
    print('saved /tmp/kr_dash_desktop.png')

    # Mobile viewport
    mp = b.new_page(viewport={'width': 390, 'height': 844})
    mp.goto(URL, wait_until='load')
    mp.wait_for_timeout(3500)
    mp.screenshot(path='/tmp/kr_dash_mobile.png')
    print('saved /tmp/kr_dash_mobile.png')
    b.close()
