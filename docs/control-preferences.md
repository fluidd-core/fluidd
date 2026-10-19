# Remembered Control folds

Milestone 3 supplies `TaskFold` (a controlled disclosure button/panel),
`PersonalTaskFold` (the account/browser adapter), and `NumberField` (an
exact value with validation). Existing Control panels move in milestone 4.

Give `PersonalTaskFold` a task title, a useful live summary, a unique DOM
`fold-id`, a stable `fold-key` such as `heat.other`, and a `printer-id`.
Use the console's stable printer ID for a linked printer. A local printer
needs a namespaced stable machine identity, not a hostname, slug or name.
Do not guess that identity from the current URL. Before identity is
available, an ordinary TaskFold can still expose controls without saving.

The store holds `{version:1, folds:Record<string,boolean>}` per person and
printer. Anonymous storage uses a separate browser namespace and is never
copied to an account. Signed-in choices use cloud's dedicated Control API.
`REMEMBER_CONTROL_FOLDS` is the single policy constant; false closes each
fold on mounting while retaining independent choices during that visit.

Mount and foreground events refresh account choices. This is sync on
return, not a live subscription to another client's clicks. A missing or
offline endpoint, expired session, unsupported payload, or blocked browser
storage shows a saving error and a retry action. The client binds each
request to captured credentials and never retries a stale request as the
next person. Retry captures the current credentials; normal account
session refresh remains the account client's responsibility.

The adapter depends on the separately reviewed cloud Control contract.
Do not release it before that endpoint and schema migration are available.
It never writes printer-wide uiSettings, email preferences or fleet layout.
