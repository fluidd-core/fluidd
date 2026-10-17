# Accounts, age and community identity

The hosted Control account area is the single account experience. It has one responsive layout and is not gated or duplicated by the printer UI's Pro/simple mode. On a printer-served build, Account sends the person to the configured hosted console; passkeys and account settings do not run against a printer origin.

## Screens and API contracts

All console calls below use the configured console origin. Models calls use a short ordinary models assertion, omit browser credentials and use `no-store`. Private declared age stays on the console: no staff proof, console bearer, email, printer history or declared age is sent in a models profile write.

| Screen | Console endpoint(s) | Models endpoint(s) and older-console behaviour |
| --- | --- | --- |
| All account screens | `GET /v1/me`; Overview/Profile also use `PATCH /v1/me` for the canonical display name | Fields absent from an older `/v1/me` response stay unavailable rather than being guessed. |
| Devices | `GET /v1/me/sessions`; `DELETE /v1/me/devices/:id`; `DELETE /v1/me/sessions?scope=others|all`; legacy fallback uses `DELETE /v1/me/sessions/:id` | A missing bulk route shows “coming soon” for sign-out-everywhere; full-account sign-out falls back to ending legacy sessions individually. A 404 for an already-ended device is success, but a genuinely missing route is an upgrade gap. |
| Security and identities | `GET /v1/config`, `/v1/me/passkeys`, `/v1/me/identities`; passkey create/options, rename/remove; identity unlink; password/email/verification; TOTP and recovery-code routes under `/v1/me` | Missing rename, recovery-code or pending-email-cancel routes show a specific “comes soon”/expiry message. Existing password or identity operations surface the refusal. |
| Fresh account reauthentication | `POST /v1/me/reauth/passkey/options`, then `POST /v1/me/reauth/passkey`; the original sensitive endpoint is then called again | Used only after `reauth_required`. If absent, passkey confirmation fails visibly and the person may use the offered password plus TOTP path; no sensitive action is sent after cancellation, expiry, account change or hidden-tab transition. |
| Notifications | `GET`/`PUT /v1/me/preferences` | A missing route leaves safe displayed defaults and marks email preferences as not yet available; it does not write defaults. |
| Printers and access | `/v1/printers/:id/shares`, `/invites`, `/links`; `/v1/approvals` and `/v1/approvals/:id` | Missing newer actions say “Coming soon”; resend availability is remembered. No optimistic access change is claimed. |
| Privacy and export | `GET /v1/retention`; `GET /v1/me/export`, or `POST /v1/me/export` with reauthentication | `GET https://models.muon3d.com/v1/library/export`. Missing/failing account retention or export is reported. A missing Library archive says none was found; invalid, changed or incomplete tar streams never become successful downloads. |
| Delete account | `/v1/me` supplies `account.deletion`; `DELETE /v1/me`; `POST /v1/me/deletion/cancel` | If the deletion field is absent, Control identifies an old console and disables deletion. It offers only the 14-day grace workflow, never immediate deletion or a second destructive action. |
| Community identity | `GET`/`PATCH /v1/me/community-identity` | `GET /v1/community/profile`; `PUT /v1/community/profile/handle`. Missing console identity support makes the card unavailable with the server error; Control never invents an age or eligibility. Models refusal/expiry remains visible and a 401 drops the cached assertion rather than replaying the mutation. |

Both signup surfaces send `declared_age` as an integer to `POST /v1/auth/sign-up`; missing or underage input is a server refusal, never a client default. Age is asked once. Console eligibility controls the shared public/private choice for canonical name and handle. Public page enablement also requires models' adult/public flags and the explicit Library page choice; private identity clears receiver page/index flags. Projection is asynchronous, so the UI says pending and offers Refresh rather than promising immediate remote privacy.

## Session and security guarantees

“Sign out” is one click and ends this browser only; other devices are explicit actions on Devices. Console handoff accepts only its pinned origin, and the temporary sign-in session is ended once the handoff exists. The account-page client (`src/services/account/client.ts`) never replays a mutation after a 401; it retries only `GET` once after refreshing. The shared Muon Cloud client (`src/services/muon-cloud/api.ts`, used by printers, sign-out and assertion minting) refreshes the stored session once and retries the request, because a 401 is the console refusing the request before acting on it. Deletion cannot be sent unless `/v1/me` proves grace-period support. Object URLs used for exports are revoked, and account/session changes abort Library downloads and stale account edits.

Features in the table must have their console routes deployed before this Control composition is published. Community profile and Library export also require models deployed first. Keep `FLUIDD_PAUSE_PUBLISH` set before merging into `develop`, through combined-head acceptance, and lift it only after those backends are live and the release is approved.

## Verification

Run the account suite and normal gates from a clean checkout:

```sh
npm ci
npx vitest run src/services/account src/components/account src/services/muon-cloud/__tests__/deletion-access.spec.ts src/services/muon-cloud/__tests__/deletion-pending.spec.ts src/services/library/__tests__/export.spec.ts src/views/__tests__/AccountEmailLink.spec.ts src/router/__tests__/account-route.spec.ts
python tools/test_account_followups.py --dist dist # after npm run build; optional Playwright acceptance
npm run lint
```

The unit suite covers one-click sign-out, grace-only deletion, no mutation replay after a 401, fresh passkey confirmation boundaries, handoff origin pinning, and cancellation on session/tab changes. The admin suite in [`admin/DEPLOY.md`](admin/DEPLOY.md) additionally enforces framed-context refusal and that staff data and proofs never enter URLs or storage.
