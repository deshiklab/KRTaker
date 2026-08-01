# KRTaker — Key Responsibility Taker

**AI-driven autonomous property management for Bangladesh.** Leases, rent collection, TDS, holding tax, maintenance and legal compliance — one platform, one digital caretaker.

![Status](https://img.shields.io/badge/status-V2%20in%20development-2F80ED) ![License](https://img.shields.io/badge/license-proprietary-lightgrey)

> **V1 = Marketing landing site + conversion funnel (released).** V2 = interactive tools, SEO, backend integration (in progress).

---

## 🏗️ Repository layout

```
KRTaker/
├── build/landing/            # Landing site build pipeline
│   ├── build.py              # template + page contents → web/*.html (21 pages)
│   ├── template.html         # shared shell: mega-menu nav, CTA, partners, footer
│   ├── pages/                # 21 page content blocks (index, register, pricing, blog…)
│   ├── test_smtp.py          # SMTP connectivity check (mail.inceptia.io)
│   ├── e2e_test.py           # API E2E: register → OTP (IMAP) → verify
│   └── shots.py / wiz_e2e.py # Playwright screenshot + wizard E2E helpers
├── web/                      # BUILD OUTPUT — generated site (also served directly)
│   ├── css/style.css         # design system (37KB: DiziConCard-inspired, KRTaker blue)
│   ├── js/                   # main.js (nav/theme/reveal/forms), i18n.js, register.js
│   ├── i18n/i18n-dict.js     # EN + বাংলা dictionaries (~250 keys × 2)
│   ├── assets/img/           # real PWA screenshots (owner/tenant dashboards)
│   └── *.html                # 21 built pages
├── docs/                     # served copy of web/ (PWA tunnel) + landing/ + docs
│   ├── design-prototype.html # Phase-1 PWA prototype (v2.2, 10 personas)
│   ├── landing/              # mirror of web/ (what the tunnel serves)
│   └── landing-improvement-plan.md, V1-RELEASE.md, V2-PLAN.md
├── landing_api.py            # Flask: serves / (PWA), /landing/* (site), /api/* (backend)
├── .env-landing              # SMTP secrets — GITIGNORED
├── landing.db                # SQLite (subscribers, contacts, newsletter) — GITIGNORED
└── PLAN.md / ROLES.md        # platform phases + 10-role model
```

---

## ✨ V1 — Landing site (released)

21 static pages generated from `template.html` + page content files. Marketing site + real conversion funnel.

### Pages
| Group | Pages |
|---|---|
| Core | Home, Register (5-step wizard), Login, Pricing |
| Audience | For Owners, For Tenants, For Partners, For NRBs |
| Product | Features, How it works, AI Caretaker, Legal & Compliance |
| Content | Blog + 3 articles (lease registration, holding tax, NRB remittance), FAQ (10), About |
| Legal | Terms, Privacy |
| Utility | Contact |

### Features
- **Full bilingual support** — EN ⇄ বাংলা toggle (nav), instant client-side switch, Hind Siliguri font, `<html lang>` sync, ~250 keys × 2 languages. Persisted per visitor.
- **Dark mode** — CSS-variable theming, persisted, audited contrast.
- **Mega menu** (Tanvir-blog style) — Platform / For you / Resources dropdown groups with gradient featured panels, emoji icon tiles, hover + focus-within on desktop, single-open accordion sheets on mobile, per-group active-state injection.
- **Real product screenshots** — hero shows the actual PWA owner dashboard (captured via Playwright from the prototype).
- **Trust strip** — bKash · Nagad · SSLCommerz · DCCI · BIDA · e-Porcha.
- **Service partners section** — 9 trade chips + "Become a partner", between CTA and footer on every page.
- **Roles grid** — 3×3 default (9 roles, Super Admin removed), responsive 2/1 cols.
- **Newsletter** — footer signup → `POST /api/newsletter` → SQLite + admin email.
- **Scroll-reveal animations**, mobile sticky CTA, favicon, a11y labels.

### Register funnel (Phase B)
Multi-step wizard: **Plan → Role → Account → Verify (email OTP) → Done**
- Real email OTP via SMTP (`mail.inceptia.io`), 5-min expiry, resend with 60s cooldown
- 14-day trial activation stored in `subscribers` table
- Duplicate-email protection, per-step validation, bilingual
- Verified E2E: register → OTP email → verify → `status=active`

---

## 🔌 Landing API (Flask, port 8878)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/register` | POST | Create subscriber (pending) + email 6-digit OTP |
| `/api/verify-otp` | POST | Validate OTP → `status=active`, trial_end = +14d, welcome email |
| `/api/resend-otp` | POST | New OTP + email |
| `/api/newsletter` | POST | Store email (unique) + notify admin |
| `/api/contact` | POST | Store message + email admin |
| `/api/health` | GET | Liveness |
| `/` | GET | PWA prototype (`docs/`) |
| `/landing/*` | GET | Landing site (`web/`) |

**Database** (`landing.db`, SQLite): `subscribers`, `contacts`, `newsletter_emails`.
**Email**: SMTP via `mail.inceptia.io:587` (STARTTLS), config in `.env-landing` (gitignored).

---

## 🛠️ Development

```bash
# Build the site (template + pages → web/, mirrored to docs/landing/)
python3 build/landing/build.py

# Run the server (static + API) — replace anything on 8878
python3 landing_api.py 8878

# Verify
curl localhost:8878/api/health
```

**Build safety:** `build.py` aborts the mirror step if `web/` is missing css/js/index — a broken source can never wipe the served copy.

**Screenshots from the PWA** (`build/landing/shots*.py`): loads `docs/design-prototype.html` headless, switches persona via `switchRole('USR-XXX')`, exports hero imagery to `web/assets/img/`.

---

## 🚀 Deployment

Current: Cloudflare quick tunnel → `localhost:8878` (Flask). Public URL (temp):
`https://servers-diagnostic-kirk-jeremy.trycloudflare.com/landing/`

Planned (V2, Phase D): **krtaker.com** via nginx + certbot (REM-ERP recipe), sitemap/JSON-LD/OG, Search Console.

---

## 🗺️ Roadmap

- **V1** ✅ Landing site + funnel (this release)
- **V2** 🔨 Interactive calculators (holding tax / TDS / rent yield), more blog content, SEO foundation, krtaker.com deployment, backend wiring
- **V3+** PWA Phase 2 backend (RBAC APIs), bKash/SSLCommerz sandbox, AI Caretaker (DeepSeek + RAG over BD statutes), PostgreSQL + row-level security

See `docs/V1-RELEASE.md` (release notes) and `docs/V2-PLAN.md` (current sprint).
