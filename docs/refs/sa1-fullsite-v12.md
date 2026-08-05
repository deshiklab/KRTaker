# SA1-fullsite-v12 — Theming v2 (v3.66 / SW v73, 2026-08-12)

User: "…continue to next tasks (CNAME verify → Theming v2)." v3.65 shipped Custom
Domains; this ref = **v3.66 / SW v73 — Theming v2** (Primary/Secondary/Accent pickers +
logo URL → CSS variables), the #5 spec-gap item.

## What it does
Super Admin sets brand colors (primary / secondary / accent) + a logo URL in the White
Label view. The API serves them publicly via `app-theme`; the dashboard and the panel
apply them as CSS variables on boot (`--primary`, `--primary-dark`, `--primary-light`,
`--secondary`, `--accent`, `--grad`, `--shadow`), and a logo URL replaces the initials
mark on login + sidebar. Tenant portals get the same branding via `host-tenant.brand`.

## Backend (api/index.php)
- **whitelabel-get defaults extended**: + `wl_secondary_color` (#1E5EB8),
  `wl_accent_color` (#27AE60), `wl_logo_url` ('').
- **`case 'app-theme'`** (public, GET whitelist): reads all `wl_%` admin_settings,
  returns `theme` = {site_name, logo_text, primary, secondary, accent, logo_url,
  favicon, theme}. No auth — dashboard/landing need it before login.

## Frontend
- **superadmin.html — White Label view**: 🎨 Brand colors panel with `<input type=color>`
  + hex-text pair per color (themeColorSync keeps them in sync), Logo URL field, live
  preview swatches (primary / gradient / accent), Save button; second panel keeps the
  existing text fields (site name, logo text, domain, favicon, login heading, footer,
  support email, theme). `applyAdminTheme()` (fetch app-theme → set CSS vars on
  documentElement) fires after login and after boot; hex helpers rgbaHex/darkenHex/
  lightenHex. `app-theme` added to API_CATALOG.
- **dashboard-v2.html**: `applyBrandTheme()` — fetch app-theme → set CSS vars + logo
  mark (backgroundImage url replaces initials) + favicon + title; called on every load
  (`applyBrandTheme();` after `initApp();`). NOTE: pre-existing `applyTheme()` (theme
  toggle) already existed — MUST NOT collide (later function declaration wins in JS).

## Pitfalls / class-notes
- **Function name collision**: dashboard already had `applyTheme()` (the dark/light
  toggle setting data-theme + localStorage). The new theming fn must be named
  `applyBrandTheme` — a later `applyTheme` declaration silently shadows an earlier one,
  so my first attempt (adding a second `applyTheme`) never ran and left CSS vars empty
  with NO error. Symptom: `applyTheme.toString()` shows the WRONG body.
- Version guards: SW v72→v73, ?v=3.65→3.66 on 11 web pages; cleanup version/sw_version
  v3.66/v72.
- Live API probes: `https://krtaker.com/api/<action>` (carried from v11).
- E2E: set color via UI picker → save via whitelabel-save → verify app-theme reflects →
  force applyAdminTheme (vars update only after boot/login) → dashboard fresh load picks
  up theme automatically → restore defaults via API → confirm PRISTINE.

## Verify
- Rig smoke **9/9** (public app-theme, defaults, save→reflect, whitelabel-get keys,
  host-tenant brand colors, restore).
- test_superadmin **446/446** (428 + 18 new).
- Full run_all **2610/2610** (48 suites).
- Live API probe: app-theme 200 with defaults.
- Live browser E2E: White Label shows 🎨 Brand colors + pickers + preview → set
  #7A3FF2/#4B2BD9/#00B894 → Save → app-theme reflects → applyAdminTheme sets panel vars
  (purple grad) → dashboard-v2 fresh load auto-applies purple vars before login →
  restore defaults via API → app-theme PRISTINE · 0 JS errors · live DB clean.
