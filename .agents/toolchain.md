# Build toolchain

Read before changing `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `eslint.config.mjs`, or dependency versions.

- Node.js and pnpm are both pinned through `devEngines` (`runtime` / `packageManager`, with
  `onFail: download`); pnpm provisions Node. No `.node-version`, no Corepack. Don't also set
  `packageManager` — pnpm 12 rejects having both
- The pnpm catalog (`pnpm-workspace.yaml`) pins `dompurify`, `echarts`, `typescript`, `vite` and
  `vue`, blanket-mapped through `overrides` so transitive deps resolve to the same version
- The `typescript` catalog entry is `npm:typescript-native-bridge@…` (tsgo), not stock TypeScript
- Local config imports use explicit `.ts` extensions and `import.meta.dirname` — no `__dirname`
- `vite-plugin-checker` runs vue-tsc and ESLint (flat config) during dev only, not at build
- `vitest.config.ts` owns environment, pool and setup files; `test:unit` is a bare `vitest`
- `codeSplitting.groups` in `vite.config.ts` pins only `lodash-es`, `vue-vendor` (vue, router,
  vuex, i18n) and `vuetify`. Everything else (monaco, echarts, hls.js, …) deliberately stays on
  default lazy chunking — don't sweep it into a group
