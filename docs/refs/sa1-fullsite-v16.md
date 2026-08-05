# SA1-fullsite-v16 — Colour-coded kanban + advanced fields on every form (panel+API, 2026-08-12)

User: "make the kanban stages colour coded. Update and get advanced field in all forms (for create, view, edit, update) For all pages / menu in superadmin.html."
Panel + API extension → **no version bump** (live stays ?v=3.66/SW v73). Commit `ef6c0fc` → 3 remotes.

## Part 1 — Kanban colour coding (frontend only)
- `KB_COLORS` map: 13 pipeline stages (lead 8 + onboarding 5) + `kbColor(st)` fallback gray (#6B7280) for Other/unknown.
- Colours: New/Started #3B82F6 blue · Contacted #06B6D4 cyan · Qualified #8B5CF6 violet · Viewing/Submitted #F59E0B amber · Applied/Verified #10B981 green · Negotiation #F97316 orange · Won/Approved #059669 emerald · Lost/Rejected #EF4444 red.
- Applied in `kanbanHtml`: column `border-top:3px solid <c>`, `.kb-h` header `background:<t>;color:<c>`, count badge same; cards get `border-left:3px solid <c>` (kbLeadCard/kbOnbCard read status → colour).

## Part 2 — Advanced fields on every form (create / view / edit / update)
**Backend** (idempotent `$mig` ALTER loop over 12 tables):
- app_users: phone, title, employee_id, joined_at, address, notes
- partners: phone, email, address, city, hourly_rate, specialties, notes
- plan_catalog: description, billing_cycle, trial_days, popular, sort_order, color
- blog_posts: author, meta_title, meta_desc, cover_image, category
- platform_tickets: category, due_at, tags
- webhooks: description, max_retries (clamped 0–20)
- integrations: description
- company_ledger: note, payee
- leads: budget, move_in
- onboarding_apps: occupation, employer, reference
- referrals: referred_phone
- subscribers: country, source (added to the v15 loop)

**Handlers extended**: users list SELECT + user-save (update+insert), provider-save, package save (app-packages), blog-posts list + blog-save, ticket-save (**now supports edit via id** + category/due/tags), integration-save, webhook-save, ledger-add, lead-save, onboard-save, referral-save, subscriber-save. All audited.

**Frontend**: forms extended (user 6, provider 7, package 6, blog 5, ticket 3 + edit mode, integration 1, webhook 2, ledger 2, lead 2, onboarding 3, referral 1, subscriber 2); new detail drawers `packageDetail`/`blogDetail`/`ticketDetail`/`integrationDetail`/`webhookDetail` + 👁 buttons on Packages/Blog/Tickets/Integrations(both views)/Webhooks rows; `detVal` handles arrays (join ', '), billing_cycle badge, popular badge, money for hourly_rate/budget; `detDrawer` already supports extra footer (v15).

## Verify
- test_superadmin **511/511** (480+31) · full regression **2675/2675** (48 suites, 0 failed).
- Runtime API smoke (rig): all 12 entities store advanced fields (user title/emp/joined, provider hourly_rate/specialties, package billing_cycle/trial_days/popular/color, blog author/meta/cover/category, ticket create+edit (subject/prio/category/due/tags updated), integration description, webhook description/max_retries=7, ledger note/payee, lead budget/move_in, onboarding occupation/employer/reference, referral referred_phone, subscriber country/source) — cleaned.
- Rig browser: kanban 8 columns all coloured (New rgb(59,130,246) → Viewing rgb(245,158,11)), card left borders; user/package/blog/ticket/subscriber forms show advanced fields; packageDetail shows all fields when populated (empty fields hide). **0 JS errors**.
- Live: API deploy 1,261,386 bytes + deploy_landing 59/59; probes (users/providers/subs new cols, package advanced save+delete, ticket create+edit+delete) all pass; live browser: 9 kanban columns all coloured, user form advanced, **0 JS errors**; live DB untouched.

## Pitfalls
- `integrationSave` is shared by the Payments view AND Integrations view — re-render must be view-aware (`STATE.view==='integrations'?renderIntegrations():renderPayments()`), otherwise saving from Payments jumps views.
- Webhook event ids are `payment.success` / `ticket.created` / `lease.signed` / `subscriber.registered` / `test.ping` — NOT `payment.received` (400 "Unknown event").
- New columns are empty on pre-existing rows — detail drawers hide empty fields, so advanced fields only appear once data exists (expected).
- detVal must handle arrays (features) or the detail drawer shows `[object Object]`-style output.
