# Socket connection & authentication

Read before touching `src/plugins/socketClient.ts`, `src/store/socket/`, `src/store/auth/`, `App.vue`'s connection/login rendering, `SocketDisconnected` or `SocketStalledSnackbar`.

## Reconnect & liveness

- Auto-reconnect retries forever, staying in `connecting`: exponential backoff from 1s, ±20%
  jitter, capped at 15s (LAN-local, so retries are cheap), reset on open. `disconnected` is
  reached only for an empty URL or an `appInit` failure
- A retry due while the tab is hidden or the browser is offline is **held**
  (`socket.retry = { held: true }`) and resumes on `visibilitychange` / `online`. A pending retry
  fires immediately on `online`, on becoming visible, or from `retryNow()` (the Retry now button)
- `socket.retry = { at }` is set only for waits ≥ 5s (`RETRY_SHOW_AFTER`), so quick retries don't
  flicker the countdown and button
- Liveness is **one timer at a time**, re-armed by any inbound frame (errors count): 10s silence →
  `server.info` ping (unauthenticated sockets get no notifications), 10s more → replace the socket.
  The stages are chained, not parallel, so after sleep the ping still gets its 10s. The timer is
  armed on `onopen`, and also bounds a socket stuck in `CONNECTING`
- `socket.stalled` is true while the ping is outstanding, and cleared by `clearSilenceTimer` (any
  frame, `handleClose`, `close`). `SocketStalledSnackbar` shows it over the main app only
- Every socket handler ignores events from a socket that is no longer `this.connection`

## State machine & auth

- No route-level auth guard. `App.vue` renders the main app when `ready`, the Login overlay when
  `authenticating`, else `SocketDisconnected`
- States: `initializing → {connecting | disconnected} → identifying → {ready | authenticating}`.
  Every transition goes through `socket/onSetStatus`, which validates it against
  `VALID_TRANSITIONS` and runs the destination's side-effects. Entering `connecting` clears
  `connectionId` / `acceptingNotifications`; `ready → connecting` also resets live-data modules
  (`charts/resetChartStore`, `MODULES_TO_RESET_ON_DROP`). An instance switch re-runs `appInit`,
  whose root `reset` sets `initializing` directly, bypassing the machine
- `runIdentify` sends `server.connection.identify` with the stored token (anonymous when no token
  is usable), then awaits the bootstrap — Fluidd's DB namespaces, `server.info`, `server.config`,
  `machine.proc_stats`, `machine.system_info`, `server.files.list('config')` — before `ready`;
  failure → `authenticating`
- `identify` is one-shot per socket: re-login on the same socket (`connectionId` set) runs only the
  bootstrap. `auth/login` stores tokens then transitions to `identifying`; `auth/logout` and
  `notifyUserLoggedOut` transition to `authenticating`, keeping the socket open
- `getAccessToken`: valid access token → use it; expired + valid refresh → `access.refresh_jwt`;
  refresh rejected as unauthorized (`isMoonrakerUnauthorizedError`) → clear both tokens and
  identify anonymously; any other refresh failure → keep tokens, return `null`, retry next cycle
