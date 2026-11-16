# Moonraker API typings

Read before adding or changing a Moonraker method or notification, `src/typings/moonraker.*.d.ts`, `src/api/socketActions.ts`, `socket/` notification handlers, `suppressError`, or Moonraker agents (`src/store/extensions/`).

## Methods

- `Moonraker.Methods` maps every JSON-RPC method Fluidd calls to `{ params, result }`, built by
  declaration merging — each `moonraker.*.d.ts` adds a `declare namespace Moonraker { interface
  Methods { … } }` block. Every entry declares both fields (`params: undefined` when none). Type
  params from the Moonraker docs, not from what Fluidd sends. Helpers: `Moonraker.Method`,
  `MethodParams<M>`, `MethodResult<M>`
- `skipLibCheck` hides `.d.ts` errors: a missing `params`/`result` only fails via `CheckedMethods`
  (`socketClient.ts`), without naming the method. A conflicting duplicate key is **not** caught
- Params in `EmitOptions<M>` are required / optional / rejected to match the method. Responses
  reach the store only through `dispatch` — there is no `commit` option
- Generic results (`server.database.*_item`, `server.spoolman.proxy`,
  `server.extensions.request`) are `unknown`; narrow with `baseEmit<'method', Narrower>(…)`
- Dispatched handlers type their payload as `ObjectWithRequest<'method'>` (result plus
  `__request__.params`; default optional params to Moonraker's documented defaults). A string
  result is dispatched as `{ result }`

## Errors

- `RequestOptions.suppressError` (`boolean | (error) => boolean`) skips the global error toast;
  the promise still rejects, so callers still `catch`. `code >= 500` is never suppressible (503
  drives klippy recovery). A predicate that throws is logged and treated as not suppressing
- Narrow a rejection with `isSocketError` (`src/util/is-socket-error.ts`, which must stay
  import-free). Moonraker rewrites 404 → `-32601` and 401 → `-32602`: test with
  `isMoonrakerNotFoundError` / `isMoonrakerUnauthorizedError`, never the HTTP code

## Notifications

- `Moonraker.Notifications` maps each handled notification to its params tuple (`undefined` when
  Moonraker sends none), merged like `Methods`. `socketClient.ts` dispatches
  `socket/<camelCase(method)>` with the **first** param only (`notify_status_update` is cached and
  flushed every second). `socket/` handlers type it as `Moonraker.NotificationPayload<'notify_…'>`;
  the module actions they forward to name the concrete type — both spellings are intentional.
  Helpers: `Moonraker.Notification`, `NotificationPayload<N>`, `NotificationAction<N>`
- `CheckedNotificationHandlers` (`src/store/socket/actions.ts`) fails type-check when an entry has
  no `socket/` action; `CheckedNotifications` (`socketClient.ts`) checks entry shape.
  Notifications outside the map are dropped as unknown actions
- Notification-only payload types end in `Event`, named after the notification minus its
  namespace (`notify_job_queue_changed` → `JobQueue.ChangedEvent`). They are standalone
  interfaces — never `extends`/alias/`Pick` a `Response`, even when the shape matches. A type
  shared with a method result keeps its `Response` name. Exception: `Authorization.UserEvent`
- `notify_user_logged_out` / `notify_user_deleted` are broadcast to every client — log out only
  when `username` is the current user. `access.get_user` returns `username: null` without a user.
  `AppUser` has no `created_on`. `notify_user_created` only fires for `moonraker`-source users,
  so `setAddUser` sets that `source` itself

## Agents

- The `extensions` module tracks connected agents from `notify_agent_event`'s `connected` /
  `disconnected`, and routes every agent event to the matching `Globals.MOONRAKER_AGENTS`
  entry's `eventDispatch`. `extensions/onExtensionsList` synthesizes `connected` for each listed
  agent; `extensions/reset` synthesizes `disconnected` before clearing
- No deduplication — agent handlers **must be idempotent** for repeated `connected` /
  `disconnected`. Entries have no init/teardown dispatch, only an optional `klippyDispatch`
  (on `klippy_state` change and `notify_klippy_disconnected`)
- `Extensions.AgentEvent`'s catch-all `event: string` defeats narrowing — use type predicates
