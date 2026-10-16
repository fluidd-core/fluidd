# Hosted Control staff portal

`/admin` is a staff surface in the hosted Control build. It is deliberately unavailable on printer-hosted Control, Library and Slicer, when Control's configured console origin differs from the page origin, or inside a frame. The portal uses the ordinary signed-in console session; staff authority additionally requires an enrolled passkey and server-side staff membership. There is no password fallback for staff authority.

Account and staff pages use the same responsive Control layout for everyone. There is **one layout**: neither the account area nor `/admin` is conditional on a Pro/simple-mode switch. A narrow viewport changes navigation presentation, not capabilities.

## Deployment order and release hold

Deploy the console implementation before enabling any of these Control features. Deploy models before enabling the features marked below. An older console must fail closed; do not shim a destructive or staff route at the CDN.

| Control feature | Console route(s) | Models route | When absent |
| --- | --- | --- | --- |
| Staff unlock | `POST /v1/me/reauth/passkey/options`, `POST /v1/me/reauth/passkey`, then `POST /v1/admin/session` | — | Portal remains locked and reports that staff tools could not be reached/confirmed. |
| Exact account lookup | `POST /v1/admin/accounts/lookup` | — | No result is exposed. If `admin_version` is absent in a successful older response, all account-action controls remain hidden. |
| Account audit | `POST /v1/admin/audit/read` | — | Read fails without changing or retaining the previous result. |
| Community audit | `POST /v1/me/staff/assertion` | `POST https://models.muon3d.com/v1/admin/audit/read` | Read fails closed. The assertion is held only for that models request. |
| Moderation queue, cases, reservations and evidence | brokered `POST /v1/admin/community` (`queue`, `case`, `reservations`, `source`, and mutations) | Indirect: the console broker owns models admission/write proof | Screen is unavailable; Control never calls models directly and never receives a write proof. |
| Staff account actions | brokered `POST /v1/admin/accounts/action` | Indirect where lifecycle propagation is needed | Controls are hidden without `admin_version`; an unavailable broker saves nothing. |

Every mutation gets a new staff-purpose WebAuthn ceremony, then sends an action/target/version/body-bound command through the same-origin console broker. A 401, unreadable reply, network failure, or 5xx is never replayed: the outcome is treated as uncertain and staff must inspect the case/account and audit before acting again. Reads may refresh the ordinary session once; writes may not. Source bytes are deliberately requested, size/hash checked, and never stored. Lock, expiry, navigation, token change, or a hidden tab clears private results and prevents a late response or passkey prompt from reopening them.

Before merging this composition into `develop`, set the release-side `FLUIDD_PAUSE_PUBLISH` hold and verify publishing is paused. Keep the hold in place through the merge and combined-head acceptance; remove it only when the console and (where required) models deployments above are live and Control is approved for publication.

## Required response headers

Configure the hosted edge/origin for `/admin` **and its SPA fallback** to send:

```http
Content-Security-Policy: frame-ancestors 'none'
Cache-Control: no-store
```

`frame-ancestors 'none'` is the server-enforced partner to Control's framed-context refusal and prevents clickjacking; JavaScript frame checks alone are not a security boundary. `no-store` prevents staff lookup, moderation, evidence and audit HTML/responses from entering browser or intermediary caches. Apply `no-store` to staff API responses too. Do not put lookup text, reasons, proofs, account data or command bodies in URLs; do not persist staff assertions, results, evidence bytes or write authority in Web Storage.

## Verification

From a clean checkout, run the dedicated admin tests, then the normal gates:

```sh
npm ci
npx vitest run src/services/admin src/components/admin src/views/__tests__/admin.spec.ts src/router/__tests__/admin-route.spec.ts
npm run lint
```

The suite enforces hosted-origin and framed-context refusal; fresh passkey confirmation for each staff mutation; origin-bound broker calls; no automatic mutation replay after a 401 or uncertain response; and no staff lookup, reason, proof or result in URLs or storage. Complete real-service membership removal, logout, WebAuthn cancellation/expiry, conflicting decisions, evidence digest, and models/console outage acceptance before lifting the publish hold.

## Release holds and limits that still apply

- Deploy console #37 (grouped devices and mandatory 14-day grace) before Control #80 consumes it.
- Staff writes are never retried automatically, including after a 401. An unreadable or network reply means the outcome is uncertain: review the case, account and audit before deciding again.
- Restoring hidden content needs a different staff member from the one who hid it, no active hold, and an elapsed counter-notice wait. Weekday targets skip weekends only, so staff must check holidays.
- Source files over 8 MiB stay pending. Downloading or hashing a file does not make an archive safe or strip its metadata. Check file privacy before any public release.
- An offline models read proof stays valid for at most two minutes after staff removal or logout. An admitted staff command can still commit within ten seconds. Neither is instant cancellation; Jack reviews both bounds before release.
- Real staff IDs, the staff file, keys and the broker pairing are configured only in a separate, authorised release.
