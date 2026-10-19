# Staff portal handoff

No deploy or staff provisioning took place in this run. This is a draft
staff page at `/admin`, on hosted Control only. The public Library
and printer-served builds cannot send staff requests from this page.

Merge the milestone 1 account draft #80 before this stack. Review the mock
makeover before its page draft. The page needs the console staff API and the
models staff audit draft; models itself needs #18 then #21. Console merge
order starts with #30, #35 and the passkey-provenance draft, which includes
#36, followed by the staff API. #37 remains the independent device/grace fix.
Deploy #37 before Control #80 consumes its grouped-device and deletion contract.

Jack must configure the console's operator-owned staff ID file and models
issuer/key/CORS trust, then run the full combined-head checks before deploy.
Use the console's existing sign-in session. Confirm staff access with a real
enrolled passkey. No password fallback grants staff authority. Nothing in
this page stores a staff assertion, adds a refresh credential or puts a
search/proof in a URL. Account details clear on lock, expiry, hidden tab or
session-token change; a late response cannot reopen them.

Acceptance on isolated local services: password-only staff and passkey-only
nonstaff both fail; Jack/Harry fixture IDs and an enrolled passkey pass;
cancel/expiry keep the page locked; exact ID/email lookup returns minimal
details and audit; prefix lookup returns no match; removed membership and
logout stop new reads; one models proof cannot be reused or used as a Library
session. A previously issued models proof has at most a two-minute offline
lease. Immediate cross-service revocation and action-bound write proofs are
required before adding mutation capabilities.

Local checks and limits are in the project PLAN.md. Complete Cargo, clippy,
Control production build and setup-budget checks remain release gates where
they could not run under the no-big-build instruction. No printer acceptance
is needed for these pages.

## Moderation and account actions draft

The milestone4 page stacks on #85 -> #84 -> #80. It adds queue/case review,
private correspondence, Jack/Harry assignment slots, handle reservations and
the existing audit view. Console account actions remain on their own origin.
Runtime requires cloud #44 and its account-actions follow-up on #42 (including
#37), and models #38 plus the report/notice follow-up on Library #37. These
add console18 and models10/11 respectively. No backend is assumed merged.

Every write opens the existing staff-purpose passkey ceremony and sends a
method/target/version/body-bound command through the console broker. The
browser receives no write proof or admission ticket. A write is never retried
automatically, including on401. Network/unreadable replies say the outcome is
uncertain and require case/account/audit review. A successful write locks and
clears private results. Hidden tab, expiry, navigation and token-change guards
prevent late responses or a late passkey prompt from sending a stale action.

Restoration needs a different actor, no active hold and an elapsed counter-
notice wait. Weekday targets need staff holiday review. Case evidence is text
only in this draft; no source file is loaded automatically. Account restoration
and deletion cancellation have separate buttons and cannot silently undo each
other. A missing account version hides write controls on older backends.

Before release, run real-service online admission/logout/removal, WebAuthn,
conflicting decisions, catalogue notice deadlines and callback outage tests.
Complete locked Rust/clippy/Geometry and the Control production build/setup
budget. Browser captures in the project folder use fixture HTTP/passkeys;
they do not establish real-service acceptance. Preserve exact consent #89,
Library #36, phone signup parity and receiver-before-sender holds. Pause
Fluidd publishing before later develop merges. No printer release is included.
