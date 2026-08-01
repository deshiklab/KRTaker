#!/usr/bin/env python3
"""Build KRTaker landing site: template + page contents → web/*.html"""
import os, re

ROOT = '/root/KRTaker'
TPL = open(f'{ROOT}/build/landing/template.html').read()
PAGES_DIR = f'{ROOT}/build/landing/pages'
OUT = f'{ROOT}/web'

NAV = { 'features':1, 'how-it-works':2, 'pricing':3, 'for-owners':4, 'for-partners':5, 'ai-caretaker':6, 'blog':7, 'about':8 }

PAGES = {
  'index': ('KRTaker — AI Property Caretaker for Bangladesh', 'KRTaker (Key Responsibility Taker) — the AI-driven autonomous property management platform for Bangladesh. Leases, rent, taxes, compliance and maintenance, 24/7.', None),
  'register': ('Register — KRTaker', 'Create your KRTaker account — 14-day free trial for property owners, service partners, legal firms and tenants.', None),
  'login': ('Log in — KRTaker', 'Log in to your KRTaker workspace.', None),
  'pricing': ('Pricing — KRTaker', 'Starter ৳5,000 · Business ৳15,000 · Enterprise ৳45,000 — simple plans for every portfolio.', 'pricing'),
  'features': ('Features — KRTaker', 'Portfolio, leases, TDS, holding tax, payments, maintenance, compliance and the AI caretaker.', 'features'),
  'how-it-works': ('How it works — KRTaker', 'From onboarding to full autonomy — the KRTaker journey step by step.', 'how-it-works'),
  'legal-compliance': ('Legal & Compliance — KRTaker', 'TPA 1882, PRCA 1991, Income Tax Act 2023 — Bangladeshi property law, encoded.', None),
  'for-owners': ('For Property Owners — KRTaker', 'Your portfolio on autopilot — invoicing, payments, compliance, maintenance.', 'for-owners'),
  'for-tenants': ('For Tenants — KRTaker', 'Pay rent online, report issues, know your PRCA 1991 rights.', None),
  'for-partners': ('For Service Partners — KRTaker', 'A steady pipeline of vetted property work orders — quotations, QC and payouts.', 'for-partners'),
  'for-nrb': ('For NRB Investors — KRTaker', 'Manage Bangladeshi property from abroad and repatriate rental income compliantly (NRTA/NITA).', None),
  'ai-caretaker': ('AI Caretaker — KRTaker', 'Meet KR — the AI that invoices, resolves liability, computes taxes and answers property law.', 'ai-caretaker'),
  'about': ('About — KRTaker', 'Why we built the Key Responsibility Taker, our principles, team and milestones.', 'about'),
  'blog': ('Insights & Blog — KRTaker', 'Guides on Bangladeshi property law, taxes and portfolio management.', 'blog'),
  'blog-lease-registration': ('Why your 2-year lease is legally invisible — KRTaker', 'TPA 1882 §107 + Registration Act §17(1)(d) explained, and how KRTaker automates the gate.', 'blog'),
  'blog-holding-tax': ('Holding tax in 4 steps: Net Annual Value — KRTaker', 'The formula city corporations use — and how to check their math.', 'blog'),
  'blog-nrb-remittance': ('NRB guide: bringing rental income home — KRTaker', 'NRTA/NITA, AD banks and the dossier that makes repatriation painless.', 'blog'),
  'faq': ('FAQ — KRTaker', 'Answers for owners, tenants, service partners and NRBs.', None),
  'contact': ('Contact — KRTaker', 'Questions, pilot onboarding, partner applications — we reply within 24 hours.', None),
  'terms': ('Terms of Service — KRTaker', 'The agreement governing use of the KRTaker platform.', None),
  'privacy': ('Privacy Policy — KRTaker', 'How KRTaker collects, uses and protects your data.', None),
}

os.makedirs(OUT, exist_ok=True)
built = []
for slug, (title, meta, active_nav) in PAGES.items():
    content = open(f'{PAGES_DIR}/{slug}.html').read()
    html = TPL
    html = html.replace('__TITLE__', title)
    html = html.replace('__META__', meta.replace('"', '&quot;'))
    html = html.replace('__CONTENT__', content)
    for i in range(1, 9):
        html = html.replace(f'__F{i}__', 'class="active"' if active_nav and NAV[active_nav] == i else '')
    out_path = f'{OUT}/{slug}.html'
    open(out_path, 'w').write(html)
    built.append((slug, len(html)//1024))

for s, kb in sorted(built, key=lambda x: x[0]):
    print(f'{s}.html  {kb} KB')
print(f'TOTAL: {len(built)} pages')

# Mirror to docs/landing so the PWA tunnel serves the site
import shutil
# SAFETY: never wipe the served copy if the source is broken
for required in (f'{OUT}/css/style.css', f'{OUT}/js/main.js', f'{OUT}/index.html'):
    if not os.path.exists(required):
        raise SystemExit(f'ABORT: {required} missing — refusing to mirror (web/ incomplete)')
docs_landing = f'{ROOT}/docs/landing'
shutil.rmtree(docs_landing, ignore_errors=True)
shutil.copytree(OUT, docs_landing)
print(f'mirrored web -> docs/landing')
