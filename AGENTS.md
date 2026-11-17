# Fluidd AI Development Guide

Fluidd is a Vue 2.7 + TypeScript web interface for Klipper 3D printers that communicates with Moonraker via WebSocket.

## Topic Guides

Subsystem detail lives in `.agents/`. **Before working in an area below, read its guide** — the
rules there are not repeated here.

| Guide                                                    | Read before touching                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`.agents/moonraker-api.md`](.agents/moonraker-api.md)   | Moonraker methods/notifications, `src/typings/moonraker.*`, `socketActions.ts`, `suppressError`, agents |
| [`.agents/socket.md`](.agents/socket.md)                 | `socketClient.ts`, `src/store/socket/`, `src/store/auth/`, reconnect, login/auth flow                   |
| [`.agents/charts.md`](.agents/charts.md)                 | `src/util/chart-*`, `src/store/charts/`, `ThermalChart`, `DiagnosticsCard`, ECharts datasets            |
| [`.agents/gcode-preview.md`](.agents/gcode-preview.md)   | `parseGcode*`, `gcode-extrusion-roles.ts`, `src/store/gcodePreview/`, `util/gcode-preview.ts`           |
| [`.agents/monaco.md`](.agents/monaco.md)                 | `src/monaco/`, `setupMonaco.ts`, Monaco workers                                                         |
| [`.agents/html-rendering.md`](.agents/html-rendering.md) | `v-safe-html`, sanitizing, `html-helpers.ts`, `ConsoleItem`, `AppNamed*` controls                       |
| [`.agents/sandboxed-eval.md`](.agents/sandboxed-eval.md) | `sandboxedEval`, diagnostics collectors, running user JavaScript                                        |
| [`.agents/history.md`](.agents/history.md)               | `src/store/history/`, `JobHistory`, CSV export                                                          |
| [`.agents/i18n.md`](.agents/i18n.md)                     | `src/plugins/i18n.ts`, Vuetify locales, `SupportedLocales`                                              |
| [`.agents/testing.md`](.agents/testing.md)               | Specs needing jsdom, `location`, `fetch` stubs; `vitest.config.ts`, `tests/unit/setup.ts`               |
| [`.agents/toolchain.md`](.agents/toolchain.md)           | `package.json`, `pnpm-workspace.yaml`, Vite/Vitest/TS/ESLint config, dependency versions                |
| [`.agents/ci.md`](.agents/ci.md)                         | `.github/`, `tools/bundle-size.mjs`                                                                     |
| [`.agents/containers.md`](.agents/containers.md)         | `.devcontainer/`, `Dockerfile`, `server/nginx/`                                                         |
| [`.agents/docs-site.md`](.agents/docs-site.md)           | anything under `docs/`                                                                                  |

## Architecture Overview

- **Vue 2.7 + Vuetify 2**: UI framework with Material Design components
- **Vuex Store**: namespaced modules mirroring Klipper/Moonraker domains (`printer/`, `files/`, `console/`, `macros/`, `webcams/`, `mmu/`, `spoolman/`, etc.)
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
- Pattern: `baseEmit(method, { dispatch, wait, params })` — `method` must be a key of `Moonraker.Methods`; `params` and the result type are inferred from it, never passed as a type argument
- Use `wait` parameter for UI loading states: `wait: Waits.onPrintStart`
- Wait constants defined in `src/globals.ts` (`Waits` object)
- Real-time updates handled via store mutations from socket events
- Method/notification typings, `suppressError`, agents: see `.agents/moonraker-api.md`. Reconnect, liveness, auth: see `.agents/socket.md`

### Component Registration

- **Auto-imported** (no manual import needed): components in `src/components/common/`, `layout/`, `ui/` — via `unplugin-vue-components` with `VuetifyResolver`
- **Manual import** required: widget components, view components
- **Lazy-loaded**: `EChart` via `Vue.component('EChart', () => import('./vue-echarts-chunk'))`
- Generated types: `components.d.ts` at repo root — **auto-generated, do not edit manually**

## Development Workflow

### Build Toolchain

- **Node.js 26** + **pnpm**, both pinned via `devEngines` in `package.json` (no Corepack)
- **Vite 8**, **vitest v5**, **`typescript-native-bridge`** (tsgo) as `typescript`
- **ES2020 lib target** (`tsconfig.app.json`) — no ES2021+ built-ins without polyfills
- Details: `.agents/toolchain.md`

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

- `src/typings/` — global `.d.ts` (`Klipper`, `Moonraker` namespaces); `src/types/` — UI-only types
- `src/components/widgets/<feature>/` — feature widgets; `src/views/` — routed pages
- `src/workers/` — Web Workers (G-code parsing, MJPEG, sandboxed eval, Monaco providers)

### Router & Authentication

- Hash-based routing (`#/path`)
- No route-level auth guard — `App.vue` picks main app / Login / `SocketDisconnected` from socket status; see `.agents/socket.md`
- Key routes: `/`, `/console`, `/jobs`, `/tune`, `/diagnostics`, `/timelapse`, `/history`, `/system`, `/configure`, `/settings`, `/camera/:cameraId`, `/preview`

### Icons & Theming

- MDI icons via `@mdi/js` — mapped in `src/globals.ts` (`Icons` object)
- Usage: `<v-icon>{{ $globals.Icons.close }}</v-icon>`
- Vuetify theme with custom dark/light overrides in `src/scss/variables.scss`
- PWA support with service worker in `src/sw.ts` (Workbox, injectManifest strategy)

## Integration Points

### Klipper/Moonraker Communication

- File operations through Moonraker's file API (`src/store/files/`)
- File uploads/downloads are the sole consumer of `axios` — direct calls in `src/mixins/files.ts` (for upload/download progress, which `fetch` cannot report for uploads), authenticated with a oneshot token fetched via `SocketActions.accessOneshotToken()`. There is no HTTP client plugin, and the rest of the app uses `fetch` or the WebSocket

### Component Communication

- Cross-component: Vuex store or `EventBus` (`src/eventBus.ts`)
- Flash messages: `EventBus.$emit(text, { timeout })` — displayed by `FlashMessage` component

### Dynamic Imports

- `import.meta.glob()` used in `src/dynamicImports.ts` for lazy-loading:
  - `I18nLocales` — locale YAML files
  - `CameraComponents` — camera service Vue components
- Views also dynamically imported in `src/router/index.ts` via `() => import('@/views/X.vue')`

## Testing Conventions

- Unit tests in any `src/**/__tests__/*.spec.ts` — not just `src/util/`; e.g.
  `src/workers/__tests__/parseGcode.spec.ts`. `tsconfig.vitest.json` includes `src/**/__tests__/*`
  at any depth, plus `src/typings/*.d.ts` so specs can reference the `Klipper`/`Moonraker`
  namespaces, and `tshelpers.d.ts`, which `src/typings` builds on (`TSHelpers.SnakeToCamelCase`)
- Global test functions (`describe`, `it`, `expect`, `vi`, `afterEach`, …) — `globals: true` in
  vitest config, typed via `/// <reference types="vitest/globals" />` in `env.d.ts`; specs import
  no vitest symbols
- Time manipulation utility: `timeTravel(date, callback)` in `tests/unit/utils.ts`
- Parameterized tests: `it.each([...])` pattern
- Test store actions/mutations independently from UI
- jsdom opt-in, `location`, `fetch` stubs, `Float32Array` precision: see `.agents/testing.md`

## Code Style

- Source must pass linting with **zero warnings and zero type errors** — run `pnpm run lint` and `pnpm run type-check` before committing
- `.editorconfig` rules: 2 spaces, LF line endings, UTF-8, trim trailing whitespace, max line 100 (code)
- camelCase for variables/methods, PascalCase for components
- `src/components/ui/` components put a kebab-case class named after the component on their main
  element (`AppInlineChart` → `app-inline-chart`), with BEM `__element` classes for inner parts
  (`app-inline-chart__label`). Their scoped styles target these classes, not Vuetify's
- Any link opening a new tab (`target="_blank"`) **must** also set `rel="noopener noreferrer"` — applies to `<a>`, `<v-btn>`/`<app-btn>` with `:href`, and any HTML strings rendered via `v-safe-html` (e.g. `src/util/html-helpers.ts`)
- Render plain text as plain text: `<span class="text-pre-wrap">{{ value }}</span>`, on one line, not `v-text` or `v-safe-html` — see `.agents/html-rendering.md`
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
- CI pipeline, reusable workflows, bundle-size report: see `.agents/ci.md`

## Common Gotchas

- SCSS deprecation warnings silenced: `import`, `global-builtin`, `slash-div`, `if-function`
- `@/scss/variables` auto-injected into all SCSS/Sass files via Vite config
- Strict Vuex mode enabled only in dev (`strict: import.meta.env.DEV`)
- **SVG files auto-optimized on commit** — pre-commit hook runs SVGO on staged `.svg`, `.vue`, and `src/globals.ts` files
- **`VUE_` env prefix required** — only env vars prefixed `VUE_` are exposed to app code via `import.meta.env` (Vite `envPrefix`)
- **`import.meta.env.VERSION`** and **`import.meta.env.HASH`** (short git hash) are injected at build time
- **`server/config.json`** is the runtime config source (deployed as `dist/config.json`) — contains theme presets, endpoints, hosted flag
- **`npm` and `npx` refuse to run inside this repo** — `devEngines.packageManager` names `pnpm`
  with `onFail: download`, which npm reads as a hard `EBADDEVENGINES` failure (no flag overrides
  it, `engine-strict` included). Use `pnpm dlx` in place of `npx`, and install pnpm itself from
  outside the clone
- **Translations managed via Weblate** — do not directly edit non-English locale files in `src/locales/`

## Communication Style

- Be extremely concise in responses
- Sacrifice grammar for brevity
- Focus on essential info only
