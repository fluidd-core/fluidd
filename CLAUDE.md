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
- **vitest v4** — unit test runner (jsdom environment)
- **`commit-and-tag-version`** — release versioning (`npm run release`)
- **ESLint flat config** (`eslint.config.mjs`) — enforced at dev time via `vite-plugin-checker` with `useFlatConfig: true`
- **`vite-plugin-checker`** — runs vue-tsc and ESLint during dev (disabled at build time)
- **`skott`** — circular dependency detection (`npm run circular-check`)
- **ES2020 lib target** (`tsconfig.app.json`) — no ES2021+ built-ins without polyfills

### Essential Commands

```bash
npm run bootstrap      # Install git hooks (after clone)
npm run dev            # Start development server (port 8080)
npm run build          # Production build
npm run type-check     # TypeScript validation (vue-tsc)
npm run lint           # ESLint with Vue/TS rules
npm run test           # Vitest unit tests
npm run circular-check # Check for circular dependencies
```

### File Organization

```text
src/
├── api/                # HTTP (axios) and WebSocket (custom JSON-RPC) clients
├── components/
│   ├── common/         # Shared dialogs & status components (auto-imported)
│   ├── layout/         # App shell: AppBar, AppDrawer, etc. (auto-imported)
│   ├── settings/       # Settings page components
│   ├── ui/             # Reusable: AppBtn, AppDialog, AppChart (auto-imported)
│   └── widgets/        # 27 feature widget dirs: bedmesh/, camera/, console/, filesystem/, macros/, mmu/, thermals/, toolhead/, etc.
├── directives/         # Custom Vue directives (v-safe-html for DOMPurify)
├── locales/            # i18n YAML files (23 languages)
├── mixins/             # Vue mixins (StateMixin, FilesMixin, etc.)
├── monaco/             # TextMate grammars and editor themes
├── plugins/            # Vue plugins (i18n, httpClient, socketClient, vuetify, filters)
├── router/             # Vue Router (hash mode) with auth guards
├── scss/               # Global styles and Vuetify variable overrides
├── store/              # 28 Vuex modules (printer, files, config, webcams, etc.)
├── types/              # UI-specific TypeScript types
├── typings/            # Global .d.ts declarations (Klipper, Moonraker namespaces)
├── util/               # Helper functions (30+)
├── views/              # Page components (Dashboard, Console, Jobs, etc.)
└── workers/            # Web Workers (parseGcode, mjpegStream, sandboxedEval)
```

### Router & Authentication

- Hash-based routing (`#/path`)
- Views lazy-loaded via dynamic imports: `component: () => import('@/views/X.vue')`
- Auth guard via `defaultRouteConfig` spread pattern; `isAuthenticated()` checks `store.state.auth`
- JWT token auth with auto-refresh (axios interceptors)
- Key routes: `/`, `/console`, `/jobs`, `/tune`, `/diagnostics`, `/timelapse`, `/history`, `/system`, `/configure`, `/settings`, `/camera/:cameraId`, `/preview`, `/login`

### Icons & Theming

- MDI icons via `@mdi/js` — mapped in `src/globals.ts` (`Icons` object, ~225 mappings)
- Usage: `<v-icon>{{ $globals.Icons.close }}</v-icon>`
- Vuetify theme with custom dark/light overrides in `src/scss/variables.scss`
- PWA support with service worker in `src/sw.ts` (Workbox, injectManifest strategy)

### Monaco Editor

- Setup in `src/components/widgets/filesystem/setupMonaco.ts`
- TextMate grammars (onigasm WASM) for `gcode`, `klipper-config`, `log` languages
- Custom CodeLens providers (links to Klipper docs from config sections)
- Document symbol + folding range providers for `klipper-config` and `gcode`
- Worker setup in `setupMonaco.features.ts` (editor, JSON, CSS workers)

## Integration Points

### Klipper/Moonraker Communication

- All printer commands via `SocketActions` methods
- Store updates from WebSocket events (not polling)
- File operations through Moonraker's file API (`src/store/files/`)
- HTTP client (`src/plugins/httpClient.ts`) for file uploads, auth tokens

### Component Communication

- Parent-child: Props down, events up
- Cross-component: Vuex store or `EventBus` (`src/eventBus.ts`)
- Flash messages: `EventBus.$emit(text, { timeout })` — displayed by `FlashMessage` component

### Dynamic Imports

- `import.meta.glob()` used in `src/dynamicImports.ts` for lazy-loading:
  - `I18nLocales` — locale YAML files
  - `MonacoLanguageImports` — TextMate grammars
  - `CameraComponents` — camera service Vue components
- Views also dynamically imported in `src/router/index.ts` via `() => import('@/views/X.vue')`

## Testing Conventions

- Unit tests in `src/util/__tests__/*.spec.ts` with Vitest + jsdom
- Global test functions (`describe`, `it`, `expect`) — `globals: true` in vitest config
- Setup file: `tests/unit/setup.ts`
- Time manipulation utility: `timeTravel(date, callback)` in `tests/unit/utils.ts`
- Parameterized tests: `it.each([...])` pattern
- Test store actions/mutations independently from UI

## Code Style

- Source must pass linting with **zero warnings and zero type errors** — run `npm run lint` and `npm run type-check` before committing
- Vue class-style components with `vue-property-decorator` (`@Component`, `@Prop`, `@VModel`, `Mixins()`)
- ESLint enforced: `neostandard` + `pluginVue.configs['flat/vue2-recommended']` + `pluginRegexp` + `@vue/eslint-config-typescript`
- `.editorconfig` rules: 2 spaces, LF line endings, UTF-8, trim trailing whitespace, max line 100 (code)
- camelCase for variables/methods, PascalCase for components
- Use `consola` for logging, not `console.log` (configured in `src/setupConsola.ts` — warn in prod, verbose in dev)
- Type imports: `import type { ... }` for types only (`verbatimModuleSyntax: true`)
- `satisfies` keyword for store module type checking

## Git & Contribution Policy

- **Conventional commits** required: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `types`, `i18n`
- **Commit subject max 50 characters** — hard-enforced by `.husky/commit-msg` hook
- **Signed-off-by** line required on all commits (use `git commit -s`): `Signed-off-by: Your Name <your@email>`
- **PR titles must follow conventional commits** — CI-enforced via `amannn/action-semantic-pull-request` (scope optional)
- **PR branches** must be off a branch other than `develop` or `master`
- **Clean develop** preferred: squash and rebase feature branches prior to merge
- **CHANGELOG visibility**: only `feat`, `fix`, `perf`, `refactor` appear in `CHANGELOG.md` (configured in `.versionrc.json`)
- **CI pipeline order**: `npm ci` → `lint --no-fix` → `type-check` → `test:unit` → `circular-check` → `build`

## Common Gotchas

- Vue 2.7 limitations: no Composition API in production builds
- WebSocket reconnection handled automatically by `socketClient.ts`
- File uploads use FormData with progress tracking in store
- Dynamic imports for code splitting (see `vue-echarts-chunk.ts`, `src/dynamicImports.ts`)
- SCSS deprecation warnings silenced: `import`, `global-builtin`, `slash-div`, `if-function`
- `@/scss/variables` auto-injected into all SCSS/Sass files via Vite config
- `path` aliased to `path-browserify` for browser compatibility
- Strict Vuex mode enabled only in dev (`strict: import.meta.env.DEV`)
- **SVG files auto-optimized on commit** — pre-commit hook runs SVGO on staged `.svg`, `.vue`, and `src/globals.ts` files
- **`VUE_` env prefix required** — only env vars prefixed `VUE_` are exposed to app code via `import.meta.env` (Vite `envPrefix`)
- **`import.meta.env.VERSION`** and **`import.meta.env.HASH`** (short git hash) are injected at build time
- **`server/config.json`** is the runtime config source (deployed as `dist/config.json`) — contains theme presets, endpoints, hosted flag
- **Translations managed via Weblate** — do not directly edit non-English locale files in `src/locales/`

## Dev Container

- VSCode Dev Container (`.devcontainer/`) bundles a `docker-klipper-simulavr` container — real Klipper/Moonraker simulation on port 7125, Fluidd on port 8080
- `postCreateCommand` runs `npm ci && npm run bootstrap` automatically

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
- Serve: `cd docs && zensical serve` or `npm run serve:docs` (localhost:8000)
- Deploy: GitHub Actions (`.github/workflows/docs.yml`) — builds on push to `master`, deploys to gh-pages with `docs.fluidd.xyz` CNAME

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
