# Build toolchain

Read before changing `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `oxlint.config.ts`, `oxfmt.config.ts`, `eslint.config.mjs`, or dependency versions.

- Node.js and pnpm are both pinned through `devEngines` (`runtime` / `packageManager`, with
  `onFail: download`); pnpm provisions Node. No `.node-version`, no Corepack. Don't also set
  `packageManager` — pnpm 12 rejects having both
- The pnpm catalog (`pnpm-workspace.yaml`) pins `dompurify`, `echarts`, `typescript`, `vite` and
  `vue`, blanket-mapped through `overrides` so transitive deps resolve to the same version
- The `typescript` catalog entry is `npm:typescript-native-bridge@…` (tsgo), not stock TypeScript
- Local config imports use explicit `.ts` extensions and `import.meta.dirname` — no `__dirname`
- `vite-plugin-checker` runs vue-tsc, oxlint and ESLint (flat config) during dev only, not at build
- Lint is split: **oxlint** (`oxlint.config.ts`) lints all JS/TS and `.vue` scripts; **ESLint**
  (`eslint.config.mjs`) only runs `eslint-plugin-vue` on `.vue`, for the template rules oxlint
  cannot parse. `pnpm run lint` runs both. **oxfmt** (`oxfmt.config.ts`) owns all formatting
- oxlint's rule set is a port of the old neostandard + typescript-eslint + regexp config, with
  `categories.correctness: 'off'` so nothing beyond it is enabled. `eslint-plugin-regexp` runs
  inside oxlint as a `jsPlugins` entry. Both oxc configs are `.ts` and type-checked through
  `tsconfig.config.json`
- oxlint **skips `no-unused-vars` in `.vue` files** (the template may use them), so ESLint keeps
  `@typescript-eslint/no-unused-vars` for `.vue` — a disable comment for it there must be an
  `eslint-disable` one; everything oxlint reports uses `oxlint-disable`
- ESLint turns off every `eslint-plugin-vue` rule of type `layout` — those are formatting, and
  fight oxfmt
- `.vue` files format with `singleAttributePerLine` and `htmlWhitespaceSensitivity: 'strict'`.
  Strict never adds or removes template whitespace, so text-node rendering is unchanged — the
  cost is `>`-hugging output. SVG `<text>` content is still padded (`>H<` → `> H <`); SVG's
  default `xml:space` strips it
- `curly` is `multi-line`: when oxfmt wraps a long braceless `if` body onto its own line, oxlint
  then wants braces — `oxlint --fix` adds them
- `oxlint` and `oxfmt` are pinned to exact versions — oxfmt is pre-1.0 and its output still
  changes between releases (0.77 replaced the Prettier-based Vue formatter outright); bump them
  together with a reformat
- `src/locales/**` (Weblate), Markdown and `docs/**` are excluded from oxfmt
- `vitest.config.ts` owns environment, pool and setup files; `test:unit` is a bare `vitest`
- `codeSplitting.groups` in `vite.config.ts` pins only `lodash-es`, `vue-vendor` (vue, router,
  vuex, i18n) and `vuetify`. Everything else (monaco, echarts, hls.js, …) deliberately stays on
  default lazy chunking — don't sweep it into a group
