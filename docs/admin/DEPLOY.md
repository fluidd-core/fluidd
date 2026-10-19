# Staff portal handoff

No deploy or staff provisioning took place in this run. This is a draft
read-only staff page at `/admin`, on hosted Control only. The public Library
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
