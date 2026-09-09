# Fluidd AI Development Guide

Fluidd is a Vue 2.7 + TypeScript web interface for Klipper 3D printers that communicates with Moonraker via WebSocket.

## Architecture Overview

- **Vue 2.7 + Vuetify 2**: UI framework with Material Design components
- **Vuex Store**: 28 namespaced modules mirroring Klipper/Moonraker domains (`printer/`, `files/`, `console/`, `macros/`, `webcams/`, `mmu/`, `spoolman/`, etc.)
- **WebSocket Communication**: Real-time JSON-RPC via custom `WebSocketClient` in `src/plugins/socketClient.ts`
- **Component Structure**: Class-style components with `vue-property-decorator`; mixins-based architecture with `StateMixin` providing common printer state access

## Key Patterns

### Component Architecture

All components use **class-style decorators** — no Options API or Composition API:

```typescript
// Standard component
@Component({ components: { /* ... */ } })
export default class MyComponent extends Vue {
  @Prop({ type: String, required: true })
  readonly label!: string

  @VModel({ type: Boolean })
  open?: boolean
}

// Component needing printer state — extend via Mixins()
@Component({ components: { /* ... */ } })
export default class PrinterWidget extends Mixins(StateMixin) {
  get klippyReady (): boolean {
    return this.$typedGetters['printer/getKlippyReady']
  }
}
```

**Available mixins** (`src/mixins/`): `StateMixin`, `FilesMixin`, `ServicesMixin`, `BrowserMixin`, `CameraMixin`, `ToolheadMixin`, `AfcMixin`, `MmuMixin`

### State Management

- Store modules in `src/store/` — each has `state.ts`, `getters.ts`, `mutations.ts`, `actions.ts`, `types.ts`
- Use `$typedState` and `$typedGetters` for type-safe store access (defined in `src/plugins/filters.ts`)
- Use `Vue.set()` for reactive dynamic state properties
- Module definition: `export const auth = { namespaced, state, getters, actions, mutations } satisfies Module<AuthState, RootState>`

### WebSocket Integration

- All printer communication through `SocketActions` in `src/api/socketActions.ts` (not direct HTTP)
- Pattern: `baseEmit<T>(method, { dispatch, wait, params })`
- Use `wait` parameter for UI loading states: `wait: Waits.onPrintStart`
- Wait constants defined in `src/globals.ts` (`Waits` object, ~90 operation types)
- Real-time updates handled via store mutations from socket events
- Auto-reconnect with configurable interval (`Globals.SOCKET_RETRY_DELAY`)
- `NotifyOptions.suppressError` (`boolean | (error: SocketError) => boolean`) skips the global `socket/onSocketError` toast for that request — the emit promise still rejects, callers still need a `catch`. A `code >= 500` is never suppressible (a 503 drives klippy recovery in `socket/onSocketError`), and a predicate that throws logs via consola and falls back to not suppressing. Narrow a caught rejection with `isSocketError` (`src/util/is-socket-error.ts`) — see `history/fetchMissingJobs` suppressing 404s from `serverHistoryGetJob`

### Component Registration

- **Auto-imported** (no manual import needed): components in `src/components/common/`, `layout/`, `ui/` — via `unplugin-vue-components` with `VuetifyResolver`
- **Manual import** required: widget components, view components
- **Lazy-loaded**: `EChart` via `Vue.component('EChart', () => import('./vue-echarts-chunk'))`
- Generated types: `components.d.ts` at repo root — **auto-generated, do not edit manually**

## Development Workflow

### Build Toolchain

- **Node.js 24** — pinned in `.node-version` (engines: `^22.12.0 || ^24`)
- **Vite 8** — build tool and dev server
- **`@pedrolamas/plugin-vue2`** — Vue 2 SFC support for Vite
- **`unplugin-vue-components/rolldown`** — auto-imports components from `src/components/common|layout|ui`
- **`sass-embedded`** — SCSS preprocessor (variables auto-injected via `@/scss/variables`)
- **vitest v4** — unit test runner; `test:unit` is a bare `vitest` call, with the jsdom environment and setup files declared in `vitest.config.ts`
- **pnpm catalog** (`pnpm-workspace.yaml`) — `dompurify`, `echarts`, `typescript`, `vite` and `vue` are pinned in the catalog and blanket-mapped through `overrides` so every transitive dependency resolves to the same version
- **`typescript-native-bridge`** — the `typescript` catalog entry is `npm:typescript-native-bridge@…` (tsgo), not stock `typescript`
- Local config imports use explicit `.ts` extensions (`./vite.config.ts`) and `import.meta.dirname` — no `__dirname`
- **`commit-and-tag-version`** — release versioning (`pnpm run release`)
- **ESLint flat config** (`eslint.config.mjs`) — enforced at dev time via `vite-plugin-checker` with `useFlatConfig: true`
- **`vite-plugin-checker`** — runs vue-tsc and ESLint during dev (disabled at build time)
- **`skott`** — circular dependency detection (`pnpm run circular-check`)
- **ES2020 lib target** (`tsconfig.app.json`) — no ES2021+ built-ins without polyfills
- `vite.config.ts`'s `build.rolldownOptions.output.codeSplitting.groups` pins `lodash-es`, `vue`/`vue-router`/`vuex`/`vue-i18n` (as `vue-vendor`), and `vuetify` into named vendor chunks; everything else (monaco, echarts, hls.js, iro, qr-scanner, …) deliberately stays on rolldown's default lazy chunking — do not sweep those into a group

### Essential Commands

```bash
pnpm run prepare        # Install git hooks (runs automatically on `pnpm i`)
pnpm run dev            # Start development server (port 8080)
pnpm run build          # Production build
pnpm run type-check     # TypeScript validation (vue-tsc)
pnpm run lint           # ESLint with Vue/TS rules
pnpm run test           # Vitest unit tests
pnpm run circular-check # Check for circular dependencies
```

### File Organization

```text
src/
├── api/                # WebSocket (custom JSON-RPC) client (`socketActions.ts`)
├── components/
│   ├── common/         # Shared dialogs & status components (auto-imported)
│   ├── layout/         # App shell: AppBar, AppDrawer, etc. (auto-imported)
│   ├── settings/       # Settings page components
│   ├── ui/             # Reusable: AppBtn, AppDialog, AppChart (auto-imported)
│   └── widgets/        # 27 feature widget dirs: bedmesh/, camera/, console/, filesystem/, macros/, mmu/, thermals/, toolhead/, etc.
├── directives/         # Custom Vue directives (v-safe-html for DOMPurify)
├── locales/            # i18n YAML files (24 languages)
├── mixins/             # Vue mixins (StateMixin, FilesMixin, etc.)
├── monaco/             # Monarch tokenizers and editor themes
├── plugins/            # Vue plugins (i18n, socketClient, vuetify, filters, colorSet)
├── router/             # Vue Router (hash mode) — no route-level auth guards
├── scss/               # Global styles and Vuetify variable overrides
├── store/              # 28 Vuex modules (printer, files, config, webcams, etc.)
├── types/              # UI-specific TypeScript types
├── typings/            # Global .d.ts declarations (Klipper, Moonraker namespaces)
├── util/               # Helper functions (30+)
├── views/              # Page components (Dashboard, Console, Jobs, etc.)
└── workers/            # Web Workers (parseGcode, mjpegStream, sandboxedEval, Monaco language providers)
```

### Router & Authentication

- Hash-based routing (`#/path`)
- Views lazy-loaded via dynamic imports: `component: () => import('@/views/X.vue')`
- No route-level auth guard — authentication is handled entirely by `App.vue`: `socketReady` → render main app; `socketAuthenticating` → render Login overlay; else → render `SocketDisconnected`. Navigating to `/login` is redirected to `home` (the route no longer exists)
- Socket state machine (`src/store/socket/actions.ts`): `initializing → {connecting | disconnected} → identifying → {ready | authenticating}`. `initializing` is the one-shot startup state; the app begins here and leaves it once `$socket.connect()` runs — transitioning to `connecting` (valid URL) or `disconnected` (empty URL). Every transition goes through `socket/onSetStatus`, which validates the edge against `VALID_TRANSITIONS`, commits the new status, and runs side-effects for the destination state. Entering `connecting` clears per-socket identity (`connectionId`, `acceptingNotifications`); `ready → connecting` additionally resets modules holding live data (`charts/resetChartStore`, which clears only the thermal bucket, plus `MODULES_TO_RESET_ON_DROP`). Re-running `appInit` (instance switch) calls `store.dispatch('reset')` which mutates socket state back to `initializing` directly via `setReset`, bypassing the state machine
- JWT auth over WebSocket: `runIdentify` sends `server.connection.identify` with the stored user token (refreshed proactively if expired); if both tokens are expired, identify is called without a token (anonymous/trusted identify). On success it awaits the post-auth bootstrap — every Moonraker DB namespace Fluidd owns (skipping any with empty ROOTS), then `server.info`, `server.config`, `machine.proc_stats`, `machine.system_info`, and `server.files.list('config')` — before transitioning to `ready`; on failure → `authenticating`. `server.connection.identify` is one-shot per socket, so the logout→login path (same physical socket, new user via `access.login`) skips the identify call (connectionId already set) and runs only the bootstrap before transitioning to `ready`. The `ready` transition itself has no side-effects — entering `ready` simply unblocks the main app render
- `auth/login` stores the fresh tokens then dispatches `socket/onSetStatus` with `identifying` to re-identify the live socket. `auth/logout` (full) transitions the socket to `authenticating`; the socket stays open and `App.vue` renders the Login overlay while `socket.status === 'authenticating'`, so login continues over the existing connection via `access.info` / `access.login`. `notifyUserLoggedOut` (fired when Moonraker invalidates the session) does the same
- Token refresh policy (`getAccessToken` in `src/store/socket/actions.ts`): valid access token → use it; expired access token + valid refresh token → call `access.refresh_jwt` and use the new token; refresh rejected with code 401 (or both tokens unusable) → clear both from localStorage and identify anonymously; refresh rejected with anything else (transient: socket drop, network) → keep tokens, return `null`, let the next identify cycle retry
- Key routes: `/`, `/console`, `/jobs`, `/tune`, `/diagnostics`, `/timelapse`, `/history`, `/system`, `/configure`, `/settings`, `/camera/:cameraId`, `/preview`

### Icons & Theming

- MDI icons via `@mdi/js` — mapped in `src/globals.ts` (`Icons` object, ~233 mappings)
- Usage: `<v-icon>{{ $globals.Icons.close }}</v-icon>`
- Vuetify theme with custom dark/light overrides in `src/scss/variables.scss`
- PWA support with service worker in `src/sw.ts` (Workbox, injectManifest strategy)

### Monaco Editor

- Setup in `src/components/widgets/filesystem/setupMonaco.ts` (includes worker environment setup)
- Monarch tokenizers for `gcode`, `klipper-config`, `moonraker-config`, `log` languages (in `src/monaco/language/*.monarch.ts`)
- `src/monaco/language/gcode-rules.ts` is the shared G-code tokenizer factory — `createGcodeRules('standalone')` backs the `gcode` language, `createGcodeRules('embedded')` is spliced into `klipper-config` values
- `klipper-config` highlights any option whose name **ends in** `gcode` (`gcode`, `*_gcode`) as a Klipper G-code template — `gcode_id`, `gcode_x_offset` and `gcode_load_sequence` merely start with it and stay plain values
- Klipper's Jinja uses **single-brace** delimiters (`{ … }`, not `{{ }}`), so these rules are not reusable for standard Jinja; both hosts must set `ignoreCase: true` at language level because Monarch drops per-rule regex flags
- Both editor themes in `setupMonaco.ts` carry `delimiter.jinja`, `keyword.control.jinja`, `variable.jinja` and `number.jinja` token colours
- Custom CodeLens providers (links to Klipper/Moonraker docs from config sections)
- CodeLens and document symbol providers for `klipper-config` and `moonraker-config`; folding range provider for `klipper-config`, `moonraker-config`, and `gcode`
- Language providers run in dedicated Web Workers (`monacoCodeLensWorker`, `monacoDocumentSymbolsWorker`, `monacoFoldingRangesWorker`)

### G-code Preview

- Parsed in `src/workers/parseGcode.worker.ts` → `parseGcode.ts` — streamed via `fetch` +
  `ReadableStream`, reporting progress by file position
- Result is a **columnar `MoveStore`** of typed arrays, not `Move` objects (`src/store/gcodePreview/types.ts`):
  `x`/`y`/`z`/`i`/`j` `Float32Array`, `tool`/`flags` `Uint8Array`, `filePosition` `Uint32Array`,
  plus a `length` — every column is indexed by the same move index
- `x`/`y`/`z` are **forward-filled** absolute positions after each move — there are no `undefined`
  axes to fall back through
- `i`/`j` are arc centre offsets, **truncated after the last `Arc` move** — only read them when
  that move has the `Arc` flag set
- `MoveFlags` is a bit field: `Extruding`, `Retracting`, `Arc`, `Clockwise` — test with
  `(flags[i] & MoveFlags.Arc) !== 0`
- The worker **transfers** the `MoveStore` buffers via `postMessage` transferables rather than
  copying them; the parser owns nothing afterwards. `defaultMoveStore` (`gcodePreview/state.ts`) is
  the empty store used on reset
- A layer's `move` is an **anchor** — the move whose *endpoint* is the layer start, i.e. the move
  before the layer's first real move. `buildLayerPaths` both seeds the toolhead from it and
  iterates from it, drawing it as a zero-length segment
- SVG path data is built by `buildLayerPaths` in `src/util/gcode-preview.ts` (extracted from the old
  `getPaths` getter, which now just delegates). Every emitted `d` **must** start with a moveto — a
  `d` beginning with `L` or `A` renders nothing
- Oversized files are truncated by the parser, which sets `truncated` on the result;
  `gcodePreview/actions.ts` surfaces it as an `EventBus` warning
  (`app.general.msg.gcode_preview_truncated`)

### Charts

- Chart data lives in a **columnar ring buffer** of `Float64Array`s (`src/util/chart-buffer.ts`),
  not an array of point objects — a `time` array plus a `Map<string, Float64Array>` of columns, all
  indexed by the same sample index
- The live window is `[offset, offset + count)`, shared by `time` and every column. Read through
  `chartBufferSource` / `chartBufferColumn` / `chartBufferLastValue` / `chartBufferLastTime`, which
  apply `offset` for you — never index a column directly
- **`revision` is the only reactive change signal.** Vue 2 observes neither typed arrays nor a
  `Map`, and the arrays are `markRaw`'d so the deep watcher skips them — writes are invisible to
  Vue. `chartBufferSource` reads `revision`, which is what re-runs a consuming computed;
  `ThermalChart` also `@Watch`es it, though `initSeries` then early-outs unless the column `Map` or
  `getChartableSensors` actually changed. Nothing goes through `Vue.set`
- Missing values are `NaN`, never `undefined` and never a hole in the index — a sample carrying no
  value for a column still advances every column
- `columns` is a `Map` for own-key semantics: on a plain object a sensor named `constructor` or
  `toString` passes `in` and its column is never created
- The `chartBufferSource` / `smoothChartSource` result **must keep `Object.prototype`** — never
  `Object.create(null)`. ECharts' `setOption` deep-clones the whole option through zrender's
  `clone`, which calls `source.hasOwnProperty(key)` and throws on a null-prototype object. That
  clone also skips a key literally named `__proto__`, so a sensor by that name cannot be charted
  regardless — not worth defending against
- `chartBufferSource` feeds ECharts' `SOURCE_FORMAT_KEYED_COLUMNS` `dataset.source` as subarray
  views. **`date` must be dimension 0**; ECharts derives the row count from column 0. Results are
  memoized per `ChartBuffer` by `revision`. The views only avoid a copy on our side — `setOption`
  deep-clones the whole option, and `clone` copies typed arrays via `Ctor.from`
- Incremental `dataset` updates **must** pass `{ replaceMerge: 'dataset' }`. A plain merge runs
  zrender's `merge`, whose array guard is `Array.isArray` — a `Float64Array` fails it, so `merge`
  recurses into the column and copies index by index. A source shorter than the one ECharts already
  holds then keeps stale trailing rows, which duplicate earlier timestamps and make the tooltip
  report two points per series
- With a keyed-columns source a tooltip `param.value` is a **positional array**, not a row object —
  resolve it via the `encode` / `dimensionNames` helpers in `src/util/chart-tooltip.ts`
- `dropExpired` binary-searches `time`, so **samples must be appended in non-decreasing time
  order**. Appending a backlog behind live samples breaks that, so the thermal history load replaces
  the buffer wholesale (`setThermalStore`). `machine.proc_stats` re-runs on every reconnect, so
  `charts/onMoonrakerStats` instead appends only the stats past the buffer's tail
  (`moonrakerChartSamples`), keeping the accumulated window; the same action handles the live
  single-stat notification, so there is one ingestion path
- `appendChartSamples` is the only append primitive — it takes a batch and bumps `revision` once
  for the whole thing, so a backlog is one re-render, not one per sample. `setChartEntry` is the
  single-sample mutation over it; `setChartEntries` takes the batch
- `retention` is **seconds everywhere**, never a sample count. `capacityFor` uses it as a
  first-guess capacity only; samples can arrive faster than 1Hz, and `compact` grows the arrays when
  they do. `resizeChartBuffer` therefore keeps the whole live window and leaves expiry to
  `dropExpired` on the next append
- History conversion is pure and lives outside the store plumbing: `thermal-history.ts` builds a
  whole buffer from `server.temperature_store`, writing columns directly and publishing with
  `commitChartSamples`; `moonraker-history.ts` only maps `machine.proc_stats` to `ChartSample`s
- Thermal history is **right-aligned on a 1Hz timeline** ending at `endTime - 1000`, with the
  lead-in **held at each sensor's oldest reading** rather than left `NaN`. That padding is
  load-bearing: `ThermalChart`'s x-axis is `max: 'dataMax'` with `min = max - retention * 1000`, so
  the window is always retention-wide and an unpadded short history renders as a stub in the corner
- Thermal column names are `<sensor>` or `<sensor>#<target|power|speed>` — build and parse them with
  `thermalColumn` / `parseThermalColumn` (`src/store/charts/thermal-columns.ts`); sensor names are
  runtime data and may themselves contain `#`
- Retention: `Globals.CHART_HISTORY_RETENTION` (1200s — thermal, diagnostics) and
  `Globals.CHART_SYSTEM_RETENTION` (600s — system, MCU, sensor). Only `thermal` carries `retention`
  on its `setChartEntry` payload — the `ChartBucket` union makes passing one for any other bucket a
  type error — because only the thermal window is server-configured, overridden by Moonraker's
  `temperature_store_size` through the `charts/getChartRetention` getter. Diagnostics is fixed at
  `CHART_HISTORY_RETENTION`, so `DiagnosticsCard`'s x-axis `min` uses the constant too; every other
  bucket keeps whatever `state.ts` gave its buffer
- `charts/resetChartStore` resets **only `thermal` and `ready`**, not the whole module — it is
  shared by the socket drop and root `resetKlippy`, and a klippy restart does not re-fetch
  `machine.proc_stats`, so blanking the other buckets would leave them with nothing to refill from
- `smoothChartSource` (`src/util/chart-smoothing.ts`) is a trailing moving average over
  `uiSettings.general.chartSmoothingWindow` seconds (0 = off, the default); `NaN` values stay `NaN`
  rather than pulling the average down. Only bare thermal columns are smoothed — `ThermalChart`'s
  `smoothableKeys` filters to `parseThermalColumn(name).sub == null`, so target temperatures, heater
  power, and fan speed stay exact. `ThermalChart` `@Watch`es `chartRevision` and
  `chartSmoothingWindow` (the raw inputs), not the smoothed source, so the paused check can skip the
  recompute entirely

## Integration Points

### Klipper/Moonraker Communication

- All printer commands via `SocketActions` methods — both init and live data flow over a single WebSocket
- Store updates from WebSocket events (not polling)
- File operations through Moonraker's file API (`src/store/files/`)
- File uploads/downloads are the sole consumer of `axios` — direct calls in `src/mixins/files.ts` (for upload/download progress, which `fetch` cannot report for uploads), authenticated with a oneshot token fetched via `SocketActions.accessOneshotToken()`. There is no HTTP client plugin, and the rest of the app uses `fetch` or the WebSocket

### Print History

- `Globals.JOB_HISTORY_LOAD` (100) bounds the initial `server.history.list` fetch; `history/onHistoryList` derives `state.allLoaded` from the echoed request's `limit` (via `ObjectWithRequest.__request__.params`, not the response), so a short page (or `limit: 0`, used by "Load all") both flip it correctly
- A job referenced by a file in the loaded file listing but outside the loaded history window is back-filled individually: `history/fetchMissingJobs` diffs against loaded jobs and `state.unresolvedJobIds`, then calls `SocketActions.serverHistoryGetJob` per missing id, suppressing 404s (`suppressError: error => error.code === 404`) since a file can reference a job Moonraker has since pruned
- Job lookups go through `history/getHistoryByIdMap` (a memoized `Map`), not a linear scan of `getHistory`

### Component Communication

- Parent-child: Props down, events up
- Cross-component: Vuex store or `EventBus` (`src/eventBus.ts`)
- Flash messages: `EventBus.$emit(text, { timeout })` — displayed by `FlashMessage` component

### Dynamic Imports

- `import.meta.glob()` used in `src/dynamicImports.ts` for lazy-loading:
  - `I18nLocales` — locale YAML files
  - `CameraComponents` — camera service Vue components
- Views also dynamically imported in `src/router/index.ts` via `() => import('@/views/X.vue')`
- `src/plugins/vuetify.ts` holds a private `locales` map of `() => import('vuetify/lib/locale/*')`
  thunks, keyed by **Fluidd** locale code, so the map doubles as the code translation
  (`zh-CN` → `zh-Hans`, `zh-HK` → `zh-Hant`, `pt_BR` → `pt`); a missing key (`ta`) leaves
  `$vuetify.lang` on `en`. `config/onLocaleChange` drives it via `loadVuetifyLocaleAsync`, which
  `Vue.set`s the locale into `lang.locales` **before** assigning `lang.current` — the `current`
  write is what re-renders. These `import()`s do not actually code-split: `vuetify/lib/presets/default`
  statically imports the `lib/locale` barrel, so every referenced locale lands in the eager
  `vuetify` chunk regardless of `codeSplitting` groups
- `loadLocaleMessagesAsync(locale?)` (`src/plugins/i18n.ts`) defaults to `getStartingLocale()` when
  called with no argument, guards on `i18n.availableLocales` rather than a separate loaded-list, and
  on a failed `I18nLocales[locale]()` import logs via consola and keeps the current `i18n.locale`
  instead of throwing. `getStartingLocale` walks `navigator.languages`, matching each entry's full
  code first (`pt-BR`, `zh-CN`) then its bare language, before falling back to
  `VUE_APP_I18N_LOCALE` or `en`. `config/onLocaleChange` holds `Waits.onLoadLanguage` for the
  duration, which drives the loading spinner on the language `v-select` in `GeneralSettings`

## Testing Conventions

- Unit tests in any `src/**/__tests__/*.spec.ts` with Vitest + jsdom — not just `src/util/`; e.g.
  `src/workers/__tests__/parseGcode.spec.ts`. `tsconfig.vitest.json` includes `src/**/__tests__/*`
  at any depth, plus `src/typings/*.d.ts` so specs can reference the `Klipper`/`Moonraker`
  namespaces
- Monarch tokenizer tests co-located in `src/monaco/language/__tests__/` — use shared `tokenize-helper.ts` (`registerLanguage`, `tokenizeLines`, `tokenBuilder`)
- Global test functions (`describe`, `it`, `expect`, `vi`, `afterEach`, …) — `globals: true` in
  vitest config, typed via `/// <reference types="vitest/globals" />` in `env.d.ts`; specs import
  no vitest symbols
- Setup file: `tests/unit/setup.ts` — includes `CSS.escape` and `window.matchMedia` polyfills required by Monaco in jsdom
- Time manipulation utility: `timeTravel(date, callback)` in `tests/unit/utils.ts`
- Parameterized tests: `it.each([...])` pattern
- Test store actions/mutations independently from UI
- Stub `fetch` with `vi.stubGlobal('fetch', …)`, always restore with `vi.unstubAllGlobals()` in
  `afterEach` — see `src/util/__tests__/http-endpoint-diagnostics.spec.ts` and
  `src/workers/__tests__/parseGcode.spec.ts` (the latter stubs a real `ReadableStream` body)
- `Float32Array` values read back are inexact (`0.2` → `0.20000000298…`) — assert with
  `toBeCloseTo`, or pick exactly-representable fixtures

## Code Style

- Source must pass linting with **zero warnings and zero type errors** — run `pnpm run lint` and `pnpm run type-check` before committing
- Vue class-style components with `vue-property-decorator` (`@Component`, `@Prop`, `@VModel`, `Mixins()`)
- ESLint enforced: `neostandard` + `pluginVue.configs['flat/vue2-recommended']` + `pluginRegexp` + `@vue/eslint-config-typescript`
- `.editorconfig` rules: 2 spaces, LF line endings, UTF-8, trim trailing whitespace, max line 100 (code)
- camelCase for variables/methods, PascalCase for components
- Any link opening a new tab (`target="_blank"`) **must** also set `rel="noopener noreferrer"` — applies to `<a>`, `<v-btn>`/`<app-btn>` with `:href`, and any HTML strings rendered via `v-safe-html` (e.g. `src/util/link-external-urls.ts`)
- Use `consola` for logging, not `console.log` (configured in `src/setupConsola.ts` — warn in prod, verbose in dev)
- Type imports: `import type { ... }` for types only (`verbatimModuleSyntax: true`)
- `satisfies` keyword for store module type checking
- `decimalRound(value, places)` (`src/util/decimal-round.ts`) is the shared rounding helper — use it
  instead of ad-hoc `Math.round(value * 100) / 100`
- **Stable `v-for` keys** — key by identity, never by index (`` :key="`component::${component.name}`" ``).
  Separators belong inside the loop with their own key (`` :key="`component:divider:${component.name}`" ``)
  rather than a trailing `v-if="i < items.length - 1"` sibling
- No double-cast type assertions (`as unknown as T`) — use a proper TypeScript type guard instead (`in`, `typeof`, `instanceof`, or a custom type predicate):

  ```typescript
  // Bad
  const x = value as unknown as { test: () => void }
  x?.test?.()

  // Good
  if (value && 'test' in value && typeof value.test === 'function') {
    value.test()
  }
  ```

## Git & Contribution Policy

- **Conventional commits** required: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `types`, `i18n`
- **Commit subject max 50 characters** — hard-enforced by `.husky/commit-msg` hook
- **Signed-off-by** line required on all commits (use `git commit -s`): `Signed-off-by: Your Name <your@email>`
- **PR titles must follow conventional commits** — CI-enforced via `amannn/action-semantic-pull-request` (scope optional)
- **PR branches** must be off a branch other than `develop` or `master`
- **Clean develop** preferred: squash and rebase feature branches prior to merge
- **CHANGELOG visibility**: only `feat`, `fix`, `perf`, `refactor` appear in `CHANGELOG.md` (configured in `.versionrc.json`)
- **CI pipeline order**: `pnpm i --frozen-lockfile` → `lint --no-fix` → `type-check` → `test:unit` → `circular-check` → `build`. The three checks after lint (`type-check`, `test:unit`, `circular-check`) each carry `if: ${{ !cancelled() }}`, so a lint failure no longer hides them — one run reports all four. `build` and the artifact upload deliberately do not, so they still skip once anything above has failed
- **Reusable workflows**: the build and both publish paths live in `_build.yml`, `_publish-docker.yml` and `_publish-web.yml` (`workflow_call`), called by `build.yml` (PRs + `develop`/`master` pushes) and `release.yml` (`v*` tags, which `build.yml` no longer triggers on). A calling job's `permissions:` is a **ceiling** on the called workflow's token, so every calling job needs its own explicit block — a top-level `permissions: {}` alone starves it. Secret *values* can't cross `workflow_call` via `with:`; `_publish-web.yml` takes them through `on.workflow_call.secrets`
- **PR bundle-size report**: `tools/bundle-size.mjs` (zero-dependency) emits a gzip-size manifest per build and diffs the PR against its merge-base, posted as a sticky comment by `pr-comment.yml`. That second workflow exists because the report has to build PR code, so it can't hold a write token — it's `workflow_run`-triggered, reads only an artifact, and takes the PR number from `pr-number.txt` since `workflow_run.pull_requests[]` is empty for fork PRs. `workflows: ['Build']` must match `build.yml`'s `name:` exactly, and a `workflow_run` trigger only fires once the file exists on the default branch
- **Bundle-size baselines are cached by `bundle-size-<hash of tools/bundle-size.mjs>-<sha>`** — the tool's own hash is in the key because the manifest format is not versioned, so without it a format change silently poisons every cached baseline (they're keyed by a base SHA that never changes) and `compare` publishes a table of `NaN B` on a green check. `compare` also rejects non-finite entries for the same reason. The compare step sets `shell: bash` for `pipefail`; the implicit default is `bash -e` without it, so a failure would be masked by `tee`

## Common Gotchas

- Vue 2.7 limitations: no Composition API in production builds
- WebSocket reconnection handled automatically by `socketClient.ts`
- File uploads use FormData with progress tracking in store
- Dynamic imports for code splitting (see `vue-echarts-chunk.ts`, `src/dynamicImports.ts`)
- SCSS deprecation warnings silenced: `import`, `global-builtin`, `slash-div`, `if-function`
- `@/scss/variables` auto-injected into all SCSS/Sass files via Vite config
- Strict Vuex mode enabled only in dev (`strict: import.meta.env.DEV`)
- **SVG files auto-optimized on commit** — pre-commit hook runs SVGO on staged `.svg`, `.vue`, and `src/globals.ts` files
- **`VUE_` env prefix required** — only env vars prefixed `VUE_` are exposed to app code via `import.meta.env` (Vite `envPrefix`)
- **`import.meta.env.VERSION`** and **`import.meta.env.HASH`** (short git hash) are injected at build time
- **`server/config.json`** is the runtime config source (deployed as `dist/config.json`) — contains theme presets, endpoints, hosted flag
- **Translations managed via Weblate** — do not directly edit non-English locale files in `src/locales/`

## Dev Container

- VSCode Dev Container (`.devcontainer/`) bundles a `docker-klipper-simulavr` container — real Klipper/Moonraker simulation on port 7125, Fluidd on port 8080
- Base image **must stay glibc** (`node:24-trixie-slim`) — `typescript-native-bridge` ships a Go `c-shared` NAPI bridge with glibc-only native packages (no `-musl` build), so on Alpine it fails to load and segfaults even with `gcompat`
- `postCreateCommand` runs `pnpm i --frozen-lockfile` automatically (which in turn runs `prepare`)

## Docker Images (production)

- `Dockerfile` builds on `nginx:alpine-slim` (`fluidd`) / `nginxinc/nginx-unprivileged:alpine-slim` (`fluidd-unprivileged`), set via a `BASE_IMAGE` build arg per matrix entry in `.github/workflows/_publish-docker.yml`
- The listen port is a `PORT` build arg re-exported as `ENV PORT` (default `80`), substituted into `server/nginx/default.conf.template` by nginx's own envsubst entrypoint at container start — **not** baked in at build time. CI used to `sed` the template's port in `build.yml`; that step is gone now that `PORT` flows through as a build arg, and the port can also be overridden at `docker run` time
- `HEALTHCHECK` (`wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz"`, every 10s) — the base image must keep `wget`; `/healthz` is a plain `200 ok` in `default.conf.template`, excluded from the access log

## Documentation Site

- **Zensical** (Material for MkDocs successor) — static site generator in `docs/`
- Config: `docs/zensical.toml` — nav, theme, extensions, social links
- Content: `docs/docs/` — Markdown files with YAML frontmatter
- Overrides: `docs/overrides/` — custom Jinja2 templates (header, htmltitle)
- Custom CSS: `docs/docs/stylesheets/extra.css` — Fluidd brand colors
- Glossary: `docs/includes/glossary.md` — abbreviation tooltips auto-appended to all pages
- Lint: `markdownlint --config docs/.markdownlint.json docs/docs/`
- Install: `cd docs && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Build: `cd docs && zensical build --clean`
- Serve: `cd docs && zensical serve` or `pnpm run serve:docs` (localhost:8000)
- Deploy: GitHub Actions (`.github/workflows/docs.yml`) — builds and lints (`codespell` + `markdownlint`) on PRs and on pushes to `master` and `develop`; uploads the Pages artifact via `actions/upload-pages-artifact` on both branches, but only `master` runs the `deploy` job (`actions/deploy-pages`)

### Documentation Structure

```text
docs/
├── docs/                  # Markdown content
│   ├── index.md           # Homepage
│   ├── getting-started.md # Installation (KIAUH, Docker, Manual, fluidd.xyz, FluiddPI)
│   ├── configuration.md   # Fluidd Config, Klipper, Moonraker, Multiple Printers
│   ├── customize.md       # Layout, themes, hiding components
│   ├── features/
│   │   ├── index.md           # Features overview (section landing page)
│   │   ├── authorization.md
│   │   ├── cameras.md
│   │   ├── console.md
│   │   ├── diagnostics.md
│   │   ├── file-editor.md     # Monaco editor features, syntax, CodeLens, folding
│   │   ├── file-manager.md    # File browser, upload, search, previews, drag-and-drop
│   │   ├── job-queue.md       # Sequential printing queue
│   │   ├── keyboard-shortcuts.md  # Global, editor, console keyboard shortcuts
│   │   ├── localization.md
│   │   ├── macros.md
│   │   ├── multi-material.md  # Multiple extruders + Spoolman
│   │   ├── multiple-printers.md
│   │   ├── printing.md        # G-code viewer, thumbnails, bed mesh, print history
│   │   ├── slicer-uploads.md
│   │   ├── system-and-notifications.md  # System info + notifications
│   │   ├── thermals.md        # Chart, presets, sensors
│   │   ├── third-party-integrations.md  # Kalico, Happy Hare, AFC, Beacon, Obico, OctoEverywhere, etc.
│   │   ├── timelapse.md
│   │   └── updates.md
│   ├── development.md     # Dev container, local dev, localization
│   ├── faq.md             # Organized by topic (Setup, Cameras, System, Printing)
│   └── sponsors.md
├── includes/
│   └── glossary.md        # Abbreviation definitions (auto-appended)
├── overrides/             # Jinja2 template overrides
├── zensical.toml          # Site configuration
└── .markdownlint.json     # Lint rules (MD013 and MD025 disabled)
```

### Documentation Conventions

- Frontmatter: `title` (required), `icon` (top-level pages only, Lucide icons)
- Images: `/assets/images/` path, stored in `docs/docs/assets/images/`
- Code blocks must always have a language tag: `ini` for Klipper/Moonraker config, `bash` for shell commands, `json` for JSON, `text` when no language applies
- Zensical uses Python-Markdown which requires 4-space indentation per nesting level for all block-level elements nested in lists (sub-lists, paragraphs, code blocks, blockquotes) — no tabs
- Tables must use aligned pipe style (columns padded to equal width)
- Links: use `{.md-button}` attribute for standalone action links
- Keys: use `++key++` syntax (pymdownx.keys extension) instead of `<kbd>`
- Terminology: G-code (not gcode/Gcode), Wi-Fi (not WiFi), GitHub (not Github), Node.js (not NodeJS), SD card (not SDCard), em dash (—) not hyphen (-) for parenthetical dashes
- Klipper macro names: format as inline code (e.g., `PAUSE`, `SET_PAUSE_AT_LAYER`, `_CLIENT_VARIABLE`)
- Klipper/Moonraker section names and config variable names: format as inline code (e.g., `[virtual_sdcard]`, `enable_object_processing`) — exception: leave unformatted when used as markdown headings
- Glossary terms (AFC, API, CNC, CORS, JWT, MCU, MMU, MPC, PID, etc.) get automatic tooltips via `docs/includes/glossary.md`
- When introducing acronyms in docs, check if they exist in the glossary — if not, assess whether they should be added (domain-specific or non-obvious acronyms: yes; universally known ones like USB, HTTP, CPU: no)
- **Before committing docs changes**, always run:
  - `markdownlint --config docs/.markdownlint.json docs/docs/` — must be clean
  - `codespell docs/docs/` — must be clean

## Communication Style

- Be extremely concise in responses
- Sacrifice grammar for brevity
- Focus on essential info only
