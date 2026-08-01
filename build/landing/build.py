#!/usr/bin/env python3
"""Build KRTaker landing site: template + page contents → web/*.html + SEO assets."""
import os, re, json
from datetime import date

ROOT = '/root/KRTaker'
TPL = open(f'{ROOT}/build/landing/template.html').read()
PAGES_DIR = f'{ROOT}/build/landing/pages'
OUT = f'{ROOT}/web'

SITE = 'https://krtaker.com'
OG_IMG = f'{SITE}/assets/og-default.png'
TWITTER = '@krtaker'
PUBLISHED = '2026-06-10'

NAV = {
  # placeholder → menu group for active-state injection
  '__MP__': 'platform', '__MF__': 'for', '__MR__': 'resources',
  '__FP__': 'pricing', '__FA__': 'ai',
}
MENU_OF = {
  'features': 'platform', 'how-it-works': 'platform', 'legal-compliance': 'platform',
  'for-owners': 'for', 'for-tenants': 'for', 'for-partners': 'for', 'for-nrb': 'for',
  'blog': 'resources', 'tools': 'resources', 'blog-lease-registration': 'resources', 'blog-holding-tax': 'resources',
  'blog-nrb-remittance': 'resources', 'blog-tds-commercial': 'resources', 'blog-nrb-buying': 'resources',
  'blog-eviction': 'resources', 'case-studies': 'resources', 'faq': 'resources', 'about': 'resources', 'contact': 'resources',
  'pricing': 'pricing', 'ai-caretaker': 'ai',
}

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
  'blog-tds-commercial': ('TDS on commercial rent: the 4% rule — KRTaker', 'Income Tax Act 2023 §128 — every commercial tenant is a collecting agent. TDS 4%, challan, certificates.', 'blog'),
  'blog-nrb-buying': ('NRB property-buying guide: from Dubai to Dhaka — KRTaker', 'NITA accounts, power of attorney and due diligence — a practical checklist before you wire money home.', 'blog'),
  'blog-eviction': ('Eviction in Bangladesh: the lawful walkthrough — KRTaker', 'PRCA 1991 grounds, the 30-day notice and why self-help eviction costs more than the rent.', 'blog'),
  'case-studies': ('Case studies — KRTaker', 'Real portfolios, real numbers: Mirpur 40-unit, Gulshan plaza and an NRB portfolio in Dubai — what changes on KRTaker.', 'resources'),
  'tools': ('Calculators — KRTaker', 'Holding tax, TDS and rent yield calculators for Bangladeshi property — instant, bilingual, accurate.', 'resources'),
  'faq': ('FAQ — KRTaker', 'Answers for owners, tenants, service partners and NRBs.', None),
  'contact': ('Contact — KRTaker', 'Questions, pilot onboarding, partner applications — we reply within 24 hours.', None),
  'terms': ('Terms of Service — KRTaker', 'The agreement governing use of the KRTaker platform.', None),
  'privacy': ('Privacy Policy — KRTaker', 'How KRTaker collects, uses and protects your data.', None),
}

os.makedirs(OUT, exist_ok=True)
built = []
# Blog posts for JSON-LD + sitemap priority (published dates)
BLOG_DATES = {
  'blog-lease-registration': '2026-06-28', 'blog-holding-tax': '2026-06-20',
  'blog-nrb-remittance': '2026-06-12', 'blog-tds-commercial': '2026-07-02',
  'blog-nrb-buying': '2026-07-08', 'blog-eviction': '2026-07-14',
}

def seo_head(slug, title, meta):
    """Canonical + OG/Twitter + JSON-LD per page."""
    url = f'{SITE}/{slug}.html'
    og_type = 'article' if slug in BLOG_DATES else ('website' if slug == 'index' else 'website')
    h = []
    h.append(f'<link rel="canonical" href="{url}">')
    h.append(f'<meta property="og:type" content="{og_type}">')
    h.append(f'<meta property="og:site_name" content="KRTaker">')
    h.append(f'<meta property="og:title" content="{title}">')
    h.append(f'<meta property="og:description" content="{meta}">')
    h.append(f'<meta property="og:url" content="{url}">')
    h.append(f'<meta property="og:image" content="{OG_IMG}">')
    h.append(f'<meta property="og:locale" content="en_US">')
    h.append(f'<meta property="og:locale:alternate" content="bn_BD">')
    h.append(f'<meta name="twitter:card" content="summary_large_image">')
    h.append(f'<meta name="twitter:site" content="{TWITTER}">')
    h.append(f'<meta name="twitter:title" content="{title}">')
    h.append(f'<meta name="twitter:description" content="{meta}">')
    h.append(f'<meta name="twitter:image" content="{OG_IMG}">')
    # JSON-LD
    ld = None
    if slug == 'index':
        ld = {
            '@context': 'https://schema.org', '@type': 'Organization',
            'name': 'KRTaker', 'url': SITE,
            'logo': f'{SITE}/pwa/icon-192.png',
            'description': meta,
            'sameAs': ['https://www.linkedin.com/company/krtaker', 'https://www.facebook.com/krtaker'],
        }
    elif slug == 'pricing':
        ld = {
            '@context': 'https://schema.org', '@type': 'SoftwareApplication',
            'name': 'KRTaker', 'url': SITE, 'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web', 'description': meta,
            'offers': [
                {'@type': 'Offer', 'name': 'Starter', 'price': '5000', 'priceCurrency': 'BDT'},
                {'@type': 'Offer', 'name': 'Business', 'price': '15000', 'priceCurrency': 'BDT'},
                {'@type': 'Offer', 'name': 'Enterprise', 'price': '45000', 'priceCurrency': 'BDT'},
            ],
        }
    elif slug in BLOG_DATES:
        ld = {
            '@context': 'https://schema.org', '@type': 'BlogPosting',
            'headline': title, 'description': meta,
            'datePublished': BLOG_DATES[slug], 'dateModified': BLOG_DATES[slug],
            'author': {'@type': 'Organization', 'name': 'KRTaker'},
            'publisher': {'@type': 'Organization', 'name': 'KRTaker', 'logo': {'@type': 'ImageObject', 'url': f'{SITE}/pwa/icon-192.png'}},
            'mainEntityOfPage': url,
        }
    elif slug == 'faq':
        ld = {
            '@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [
                {'@type': 'Question', 'name': 'What does KRTaker cost?',
                 'acceptedAnswer': {'@type': 'Answer', 'text': 'Starter ৳5,000, Business ৳15,000 and Enterprise ৳45,000 per month, each with a 14-day free trial.'}},
                {'@type': 'Question', 'name': 'Is the AI caretaker included?',
                 'acceptedAnswer': {'@type': 'Answer', 'text': 'The AI caretaker (KR) is included in the Enterprise plan and available as an add-on for Business.'}},
            ],
        }
    if ld:
        h.append(f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>')
    return '\n'.join(h)

for slug, (title, meta, active_nav) in PAGES.items():
    content = open(f'{PAGES_DIR}/{slug}.html').read()
    html = TPL
    html = html.replace('__TITLE__', title)
    html = html.replace('__META__', meta.replace('"', '&quot;'))
    html = html.replace('__SEO__', seo_head(slug, title.replace('"', '&quot;'), meta.replace('"', '&quot;')))
    html = html.replace('__CONTENT__', content)
    for m in ('__MP__', '__MF__', '__MR__', '__FP__', '__FA__'):
        html = html.replace(m, 'active' if MENU_OF.get(slug) == NAV[m] else '')
    out_path = f'{OUT}/{slug}.html'
    open(out_path, 'w').write(html)
    built.append((slug, len(html)//1024))

for s, kb in sorted(built, key=lambda x: x[0]):
    print(f'{s}.html  {kb} KB')
print(f'TOTAL: {len(built)} pages')

# ── sitemap.xml ──
PRIORITY = {'index': 1.0, 'pricing': 0.9, 'features': 0.9, 'how-it-works': 0.8, 'for-owners': 0.8,
            'for-tenants': 0.8, 'for-nrb': 0.8, 'for-partners': 0.8, 'register': 0.9, 'case-studies': 0.7,
            'tools': 0.8, 'ai-caretaker': 0.7, 'legal-compliance': 0.7}
today = date.today().isoformat()
urls = []
for slug in PAGES:
    lastmod = today
    if slug in BLOG_DATES:
        lastmod = BLOG_DATES[slug]
    prio = PRIORITY.get(slug, 0.5)
    urls.append(f'  <url>\n    <loc>{SITE}/{slug}.html</loc>\n    <lastmod>{lastmod}</lastmod>\n    <changefreq>{"weekly" if slug in BLOG_DATES or slug == "blog" else "monthly"}</changefreq>\n    <priority>{prio}</priority>\n  </url>')
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(urls) + '\n</urlset>\n'
open(f'{OUT}/sitemap.xml', 'w').write(sitemap)
print(f'sitemap.xml  {len(urls)} URLs')

# ── robots.txt ──
robots = f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n'
open(f'{OUT}/robots.txt', 'w').write(robots)
print('robots.txt')

# ── _headers (Cloudflare Pages friendly) ──
open(f'{OUT}/_headers', 'w').write('/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/css/*\n  Cache-Control: public, max-age=31536000, immutable\n/js/*\n  Cache-Control: public, max-age=31536000, immutable\n')
print('_headers')

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
