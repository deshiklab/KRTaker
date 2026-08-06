# SA1-fullsite v20 — Team / Sub-accounts + Seat enforcement

Shipped **2026-08-06** (panel+API, no version bump). Closes the last display-only limit
(`seats`) by adding subscriber **team members** — separate logins that share the parent
subscriber's workspace, role-restricted, seat-counted.

## Concept
- New table `team_members` (id, sub_email=parent, name, email UNIQUE, password_hash, role, status, created_at, last_login).
- **Token kind `'team'`** — `app_tokens.user_id` = team_member.id. `current_user()` resolves member → loads PARENT subscriber row, then overlays: `kind='sub'` (inherit plan/limits/scoping!), `team_member=true`, `team_id`, member `name` + `role`.
- **CRITICAL:** `current_user()`'s trailing `$row['kind'] = $tok['kind']` must be skipped for team tokens (`if ($tok['kind'] !== 'team')`) — otherwise kind='team' makes `plan_for_user`/`effective_modules` return **Enterprise/full-base = privilege escalation** on starter/business plans.
- Seats: plan `seats` = owner(1) + active team members. team_limit = seats − 1.
- Login: `app-login` checks subscribers → app_users → **team_members**; token minted as `make_token(team_id, 'team')`; member `last_login` on team_members.

## API actions (all POST, Bearer; owner or superadmin only — `team_owner_only()`)
- `team-list` → members + `{seats, used, team_limit}` (superadmin can pass `email` target; defaults to first subscriber)
- `team-invite` {name, email, role} → validates email uniqueness across subscribers/app_users/team_members (409), enforces seat cap (403 "Plan seat limit reached (N of M team seats)…"), returns **password once** (8 hex chars), role ∈ manager/accountant/svc_mgr/legal/crm/hr
- `team-reset` {id} → new password once + revoke tokens
- `team-update` {id, role?|status?} → role change revokes tokens (re-login picks up new role); disable revokes
- `team-remove` {id} → delete + revoke tokens
- `team_revoke_tokens()` = `DELETE FROM app_tokens WHERE kind='team' AND user_id=?`

## Self-service safety (member must NOT mutate the owner)
- `app-profile`: if `$u['team_member']` → table=team_members, uid=team_id, token kind='team'; name+password only (no org/phone); **token invalidation uses uid+tok_kind** (not `$u['id']`/`$u['kind']` — that would nuke the owner's sessions); tenant-sync block skipped for members.

## Dashboard
- Settings → **Team tab** (owner + superadmin only; hidden for team_member logins and demo): seats card, add-member form (name/email/role), member list with 🔑 reset / ⏸ toggle / 🗑 remove.
- Team members log in normally; sidebar/modules render from their role; `LIVE.user.team_member` flag available.

## Tests — `test_team.py` (46 checks, wired into run_all as suite #51)
Invite→login→overlay (plan/name/role/kind), RBAC (manager lacks subscriptions), workspace scoping (same properties as owner), role-change + token revocation, disable/enable, reset, **seat cap on business plan (2 team seats → 3rd blocked; disabled frees seat)**, duplicate email 409, member self-service (password change doesn't touch owner; name edit goes to own row), remove + revocation.

## Pitfalls learned
- **PHP function declarations INSIDE a switch case are only defined after execution passes them** — helpers called by other cases must live in the global function area (team_owner_only etc. broke with "undefined function" from inside the switch).
- **Rig IP lockout**: repeated test runs accumulate `auth_attempts` failures on 127.0.0.1 → 429 blocks ALL logins. Clear `auth_attempts WHERE ip='127.0.0.1'` at test start/end AND in run_all's reset block.
- Don't hardcode owner display names in tests — capture from app-me (rig name ≠ live name).
- `app-bootstrap` returns collections under `collections` key, not `data`.
- `user_payload` plan label is the raw DB value ('business' vs 'Business' casing differs).
