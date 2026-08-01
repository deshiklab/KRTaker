# KRTaker V2 — Sprint Plan

**Base:** v1.0.0 (landing site + funnel released) · **Repo target:** deshiklab/KRTaker

## Goal
Turn the marketing site from *describe* into *prove*: interactive tools, deeper content, SEO foundation, and real-domain deployment — then wire the funnel to the platform backend.

## Sprint backlog (ordered)

### V2.1 — Interactive calculators ✅ (started)
Single page `tools.html` (also linked from Resources mega-menu):
- **Holding tax calculator** — GAR → −2-month allowance → −mortgage interest → Net Annual Value → city corporation rate (0–10% slabs) → annual + quarterly liability
- **TDS calculator** — gross rent, residential 10% / commercial 4% (ITA 2023 §109/§128) → TDS amount + net payable
- **Rent yield calculator** — annual rent ÷ property value → gross yield; after holding tax + TDS → net yield
- Bilingual (EN/বাংলা), dark mode, live results, quick-fill example buttons

### V2.2 — Content depth
- 3 more blog posts: TDS for commercial tenants, NRB property-buying guide, eviction walkthrough
- Case studies page (Mirpur 40-unit, Gulshan plaza, NRB Dubai) with numbers

### V2.3 — SEO foundation (Phase D)
- sitemap.xml + robots.txt + canonical + JSON-LD (Organization / SoftwareApplication / FAQPage)
- OG/Twitter cards per page (1200×630)
- Google Search Console + Bing verification
- Perf: inline critical CSS, preload font, lazy-load below-fold

### V2.4 — Real domain + HTTPS (krtaker.com)
- nginx + certbot (REM-ERP recipe), DNS A record → server IP
- Replace trycloudflare tunnel with production serving
- Subdomain split: krtaker.com (landing), app.krtaker.com (PWA), api.krtaker.com (API)

### V2.5 — Backend wiring (funnel → platform)
- Password hashing + real auth for registered subscribers
- Subscriber onboarding state machine (trial → active → paid)
- SMS OTP gateway (BD) alongside email OTP

## Acceptance criteria
- All calculators verified in-browser (playwright), correct math vs. known examples
- Lighthouse ≥ 90 perf/SEO on home + pricing
- krtaker.com live over HTTPS; Search Console reporting
- Register wizard creates real authenticated subscribers

## Status
- [x] V2 kickoff, README/V1 release docs, tag v1.0.0
- [x] Calculators (holding tax / TDS / yield) — verified vs. blog example (NAV ৳20L → 8% → ৳1.6L)
- [x] Blog + case studies (3 new posts: TDS commercial, NRB buying, eviction; case-studies page with Mirpur/Gulshan/Dubai)
- [x] SEO foundation (sitemap.xml 26 URLs, robots.txt, canonical, OG/Twitter cards, JSON-LD Organization/SoftwareApplication/BlogPosting/FAQPage, OG image 1200×630, font preload, _headers)
- [x] Back-to-top button + AI chat widget (KR assistant, bilingual EN/BN knowledge base, quick chips, typing indicator — LLM-pluggable for Phase 5)
- [ ] krtaker.com deployment
- [ ] Auth wiring
