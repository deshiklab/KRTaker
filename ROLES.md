# KRTaker — User Roles & Permissions Model

**Version:** 1.0 · Status: 🎯 Defined (prototype explorer live in v2.2)

---

## 1. Role Hierarchy

```
                        ┌─────────────────────────────────────────┐
                        │         SUPER ADMIN (Platform)          │
                        │  Kabir & team · owns the SaaS platform  │
                        └──────────────┬──────────────────────────┘
          ┌─────────────────┬──────────┴───────────┬─────────────────┐
          ▼                 ▼                      ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐
│ PLATFORM STAFF  │ │ SERVICE PARTNER │ │    SUBSCRIBER    │ │  LEGAL TEAM  │
│ (employees)     │ │ (B2B org)       │ │ (Property Owner) │ │ (B2B firm or │
│ · Service Mgr   │ │  · own team     │ │  ┌──────────────┐│ │  employees)  │
│ · CRM & HelpDesk│ │  · services     │ │  │ Managers     ││ │  · cases      │
│ · Accountant    │ │  · quotations   │ │  │ (sub-users)  ││ │  · compliance │
│ · HR & Admin    │ │  · billing      │ │  └──────┬───────┘│ │  · e-Porcha   │
└────────┬────────┘ └─────────────────┘ │         ▼         │ └──────────────┘
         │                              │  ┌──────────────┐ │
         └────── QC / inspect ◄─────────┼──┤   TENANTS    │ │
                                        │  └──────────────┘ │
                                        └────────────────────┘
```

**Rules:**
- **Platform staff** (Service Manager, CRM, Accountant, HR) are employees of KRTaker — they serve all subscribers/partners.
- **Legal** can be platform employees *or* external firms/consultants onboarded B2B; subscribers can also be offered legal services as an add-on.
- **Managers** are sub-users created by the Property Owner (Subscriber) — scoped to assigned properties only.
- **Tenants** are invited by Owner/Manager — they see only their own unit/lease/invoices.
- **Service Partners** are B2B orgs — they never see other partners' or owners' data.

---

## 2. Role Definitions

### 1. Super Admin — *Platform Owner & Team*
> "Runs KRTaker as a business."
- **Sees:** everything — all tenants' data, all platform operations.
- **Modules:** Subscriptions & Plans, Platform Billing/MRR, Web CMS, Packages, Integrations (bKash/SSLCommerz/e-Porcha), Service Partner management, Legal team management, Accounts & Finance, CRM & Help Desk (supervision), HR & Admin, Settings, all business modules (read/audit).
- **Powers:** create/disable subscribers & partners, set plan prices, configure payment gateways, approve partner onboarding, override compliance gates, audit logs.

### 2. Subscriber — *Property Owner / Org Admin*
> "Buys a subscription; runs their property portfolio."
- **Sees:** own portfolio only (properties, units, tenants, leases, invoices, receipts, taxes, maintenance, compliance, AI).
- **Modules:** Dashboard, Properties, Units, Tenants, Leases, Invoices, Receipts, Payments, Taxes, Maintenance, Compliance, AI Assistant, Help Desk tickets, Subscription (own plan).
- **Powers:** full CRUD within portfolio; invite Managers & Tenants; hire Service Partners; engage Legal; approve invoices/payments.

### 3. Manager — *Property Manager (sub-user of Owner)*
> "Day-to-day operator for assigned properties."
- **Scoped to:** properties assigned by the Owner (e.g., P-001 + P-005).
- **Sees:** same modules as Owner but **read/write limited to assigned properties**; no billing/subscription; cannot add/remove Managers; cannot approve spend above a limit.
- **Powers:** manage tenants/leases/invoices/maintenance for assigned units; report issues; assign contractors.

### 4. Tenant
> "The paying resident/occupant."
- **Sees:** own unit, own lease, own invoices, own receipts, own maintenance tickets.
- **Modules:** My Unit, My Lease, My Invoices, Pay Rent (bKash/SSLCommerz), Report Issue, AI Assistant (limited: liability/legal Q&A), Support.
- **Powers:** pay rent, report issues, upload repair invoices for deduction (PRCA), update profile.
- **No access** to other tenants, portfolio financials, or compliance internals.

### 5. Service Partner — *B2B Contractor Org*
> "Sells services (maintenance, renovation, security, cleaning)."
- **Sees:** own org profile, own services catalog, quotations, work orders (maintenance tickets) assigned to them, own billing/payouts, own team.
- **Modules:** Partner Dashboard, Services Catalog, Quotations, Works (assigned tickets + status updates), Billing & Payouts, Team, Support.
- **Powers:** manage services & pricing; quote on work; update work status with photos; add team members; receive QC from Service Manager.

### 6. Service Manager — *Platform Employee (QC)*
> "Inspects & quality-checks partner works."
- **Sees:** all work orders across partners; inspection queue; QC reports; partner performance.
- **Modules:** QC Dashboard, Works & Inspections, Partner Performance, Escalations.
- **Powers:** assign/route work to partners, approve/reject completed work, rate partners, flag compliance issues.

### 7. Legal Team — *Platform Employee or B2B Firm/Consultant*
> "Mitigates legal & compliance."
- **Sees:** lease registration tracker, eviction cases, PRCA disputes, khatian/e-Porcha verification tasks, case docket.
- **Modules:** Legal Dashboard, Cases & Docket, Lease Registration Review, Eviction Proceedings, e-Porcha Verification, Statutory Calendar, AI legal RAG (full).
- **Powers:** verify registration docs, generate compliant notices, issue legal opinions, manage case lifecycle. Can be onboarded B2B and offered to subscribers as an add-on service.

### 8. CRM & Help Desk — *Platform Employee (Support)*
> "Runs support ticketing & subscriber relationship."
- **Sees:** all support tickets, subscriber/partner contacts, SLA timers.
- **Modules:** Help Desk Dashboard, Tickets (all), Knowledge Base, Subscriber/Partner CRM, Follow-ups, Satisfaction (CSAT).
- **Powers:** triage/assign/resolve tickets, escalate to other staff, run onboarding calls, log CRM notes.

### 9. Accountant — *Platform Employee (Finance)*
> "Owns platform financials."
- **Sees:** all platform money — MRR, subscriptions, gateway settlements, partner payouts, expenses, TDS (platform-level).
- **Modules:** Finance Dashboard, Platform Revenue (MRR/ARR), Subscription Billing, Gateway Settlement, Partner Payouts, Expenses, TDS & VAT Ledger, Reports (XLSX/PDF).
- **Powers:** reconcile payments, generate invoices for subscribers, process partner payouts, export financial reports.

### 10. HR & Admin — *Platform Employee (Ops)*
> "Manages staff & admin operations."
- **Sees:** staff directory, roles, onboarding, payroll inputs, asset/IT admin, office ops.
- **Modules:** HR Dashboard, Staff Directory, Onboarding, Attendance, Payroll Inputs, Document Vault, Settings (org).
- **Powers:** hire/offboard staff, assign roles (staff side), manage org settings, audit internal access.

---

## 3. Permission Matrix (module × role)

Legend: ✅ full · 👁 read-only · 🔒 scoped (own/assigned) · — none

| Module | SuperAdmin | Owner | Manager | Tenant | Partner | SvcMgr | Legal | CRM | Acct | HR |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Properties | ✅ | ✅ | 🔒 | 👁 own unit | — | 👁 | 👁 | 👁 | 👁 | — |
| Units | ✅ | ✅ | 🔒 | 👁 own | — | 👁 | — | 👁 | — | — |
| Tenants | ✅ | ✅ | 🔒 | self | — | — | — | 👁 | — | — |
| Leases | ✅ | ✅ | 🔒 | 👁 own | — | 👁 | ✅ | 👁 | 👁 | — |
| Invoices | ✅ | ✅ | 🔒 | 👁 own | own | 👁 | 👁 | 👁 | ✅ | — |
| Receipts | ✅ | ✅ | 🔒 | 👁 own | own | — | — | — | ✅ | — |
| Payments | ✅ | ✅ | 🔒 | pay own | billing | 👁 | — | — | ✅ | — |
| Taxes | ✅ | ✅ | 🔒 | — | own | — | 👁 | — | ✅ | — |
| Maintenance | ✅ | ✅ | 🔒 | report | 🔒 works | ✅ | — | 👁 | 👁 costs | — |
| Compliance | ✅ | ✅ | 🔒 | — | — | — | ✅ | — | — | — |
| AI Assistant | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subscriptions | ✅ | 👁 own | — | — | — | — | — | 👁 | ✅ | — |
| Packages | ✅ | 👁 | — | — | — | — | — | — | — | — |
| Integrations | ✅ | — | — | — | — | — | — | — | — | — |
| Web CMS | ✅ | — | — | — | — | — | — | — | — | — |
| Service Partners | ✅ | 👁 | — | — | self | ✅ | — | 👁 | ✅ | — |
| Legal Team | ✅ | 👁 | — | — | — | — | self | — | — | — |
| CRM & Help Desk | ✅ | ticket | ticket | ticket | ticket | ticket | ticket | ✅ | ticket | ticket |
| Accounts & Finance | ✅ | — | — | — | — | — | — | — | ✅ | — |
| HR & Admin | ✅ | — | — | — | — | — | — | — | — | ✅ |
| Settings | ✅ | own org | limited | own profile | own org | own | own | own | own | own |

---

## 4. Demo Users (prototype explorer)

| # | Role | Demo user | Scope |
|---|---|---|---|
| 1 | Super Admin | Kabir (Platform) | everything |
| 2 | Subscriber / Owner | Rofiqul Islam | full portfolio |
| 3 | Manager | Shakil Ahmed | P-001, P-005 |
| 4 | Tenant | Sultana Rahman | U-010 (Dhanmondi Apartment) |
| 5 | Service Partner | Rahim Steel Works | MT-001 work order |
| 6 | Service Manager | Arif Chowdhury | QC queue |
| 7 | Legal Team | Barrister Naima | cases & registration review |
| 8 | CRM & Help Desk | Mithila Rahman | ticket queue |
| 9 | Accountant | Sohel Rana | platform finance |
| 10 | HR & Admin | Nusrat Jahan | staff directory |

**Explore:** click the avatar (top-right) → **Switch role** → pick a persona. Nav, dashboard, and data scope change to that user's world.

---

## 5. Roadmap mapping

- **Phase 2 (backend):** users table + RBAC middleware (JWT claims), role-scoped API filters (`WHERE owner_id = …` / tenant scoping).
- **Phase 4:** Tenant portal (mobile-first, separate token auth — REM portal pattern), Service Partner portal, Legal portal.
- **Phase 5 (AI):** agent tool calls inherit role permissions (tenant agent cannot call `update_lease_terms`).
- **Phase 6 (multi-tenant):** PostgreSQL RLS policies keyed on `owner_id`/`tenant_id` per this model.
