# SA1-fullsite v19 — PWA + Web Push Notifications

Shipped **2026-08-06** (panel+API+assets; no version bump — live stays v3.66/SW v73→**v74**).
Scope: installable dashboard PWA (manifest-dash.json) + RFC 8291/8292 web push for
maintenance tickets & rent payments, with real triggers wired.

## Files touched
- `/root/KRTaker/web/sw.js` → **v74**: added `push` + `notificationclick` handlers, added `manifest-dash.json` to STATIC. (Landing sw.js is source of truth; `/root/krtaker-deploy/sw.js` is a STALE copy — ignore it.)
- `/root/KRTaker/web/manifest-dash.json` (new): start_url=`dashboard-v2.html`, standalone, shortcuts.
- `/root/KRTaker/docs/dashboard-v2.html`: `<link rel="manifest" href="manifest-dash.json">` in head; **Push notifications** block in Settings→Preferences; `pushUpdateUI/enablePush/testPush/installApp` + SW registration + auto-update reload; `beforeinstallprompt` → Install app button (`installAppBtn`).
- `/root/krtaker-deploy/api/index.php`: `push_subs` table; VAPID keys (embedded via script — keys never shown in chat); 5 actions (`push-state/save/remove/test/send`); `push_to_user()`; hooks in `app-ticket-create` + `app-payment-confirm`.
- `/root/krtaker-deploy/deploy_landing.py`: added manifest-dash.json upload.

## API surface (all POST, Bearer auth)
- `push-state` → `{vapid_public, subs}` (vapid_public = base64url 65-byte point, 87 chars)
- `push-save` `{endpoint, p256dh, auth}` — endpoint must be https, p256dh 65 bytes, auth 16 bytes; upsert on endpoint; max 10 devices/user
- `push-remove` `{endpoint}`
- `push-test` → sends to caller's own devices
- `push-send` `{email,title,body,url}` — superadmin only
- Hooks: `app-ticket-create` pushes owner (unless creator IS owner); `app-payment-confirm` pushes invoice owner (tenant pays → owner alert). Both skip silently on no-sub or errors.

## Crypto implementation (the hard part — all validated)
- VAPID: ES256 P-256 keypair (openssl ecparam). JWT = `{typ:JWT,alg:ES256}` + `{aud: endpoint origin, exp: now+12h, sub: mailto:}`. **`openssl_sign` returns DER — must parse to raw r||s (strip 0x00 prefixes, pad to 32) for JWT.**
- **PITFALL 1: `openssl_pkey_derive()` only accepts a PEM string** (not resource, not raw DER). Convert ua raw point → SPKI DER → **PEM-armor it** (`-----BEGIN PUBLIC KEY-----` + chunk_split(base64,64) + END). Raw DER is rejected by `openssl_pkey_get_public` in PHP 8.4.
- **PITFALL 2: `hash_hkdf()` re-extracts and is NOT RFC 8291.** Use manual HKDF-Expand: `T(i) = HMAC(PRK, T(i-1) || info || 0x01)`.
- Derivation: `PRK=HMAC(salt, ecdh)`, `IKM=Expand(PRK,"Web Push: info"||ua_pub||as_pub,32)`, `PRK2=HMAC(auth,IKM)`, `CEK=Expand(PRK2,"Content-Encoding: aes128gcm\0",16)`, `NONCE=Expand(PRK2,"Content-Encoding: nonce\0",12)`.
- aes128gcm framing: header = salt(16)||rs(4 BE=4096)||idlen(1=65)||server_pub(65); body = header||cipher||tag(16); plaintext = `\x02` + JSON payload. AAD = header.
- Send: cURL `CURL_HTTP_VERSION_2_0`, headers `TTL`, `Urgency: normal`, `Content-Encoding: aes128gcm`, `Authorization: vapid t=<jwt>, k=<pub b64url>`. 201=delivered; 404/410=dead sub→delete row.

## Validation (proven before deploy)
- `/tmp/wp_test.php` (extracts real functions from the API file via brace-counting line extractor) + `/tmp/wp_dec.mjs` (Node RFC 8291 decrypt) → **round-trip PASS** (incl. ৳ unicode).
- `/tmp/wp_jwt.php` + `/tmp/wp_jwt_verify.mjs` → **JWT signature valid** (raw→DER re-encode then crypto.verify — Node's `verify(pub, sig, {dsaEncoding})` does NOT work in Node 22; options aren't honored, use DER form).
- `/tmp/test_push.py` → **22/22** on rig incl. FCM 404 on fake token → dead-sub auto-remove (proves the whole HTTP+VAPID chain reaches Google; 403 would mean bad VAPID).
- Wired into `run_all.py` (50 suites).

## Live E2E recipe
1. Deploy: `deploy_landing.py` (sw/manifest/dashboard) + `ftp_api_p45.py` (api/index.php), sync BOTH rig copies (`/tmp/krtest/index.php` AND `/tmp/krtest/api/index.php`), restart rig (kill 479366-style PID, `php -S 127.0.0.1:8899`).
2. Browser: https://krtaker.com/dashboard-v2.html → login → Settings→Preferences→Enable → headless may deny permission; verify via API `push-state`/`push-test` result codes instead.

## Gotchas
- Fake subscription keys MUST be real curve points (openssl rejects `\x04 + 'A'*64`); generate via Node ECDH in test scripts.
- Tenant demo users are in `subscribers` (roles: owner@=owner, sultana@=tenant, rahim@=partner, kabir@=superadmin in app_users) — sultana's lease L-007 → unit U-010 for hook tests.
- `execute_code` blocked → write scripts to /tmp + run via terminal.
- Deploy order matters: frontend references API actions; ship API first or together.
