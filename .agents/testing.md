# Unit testing details

Read before adding a spec that needs a DOM, `location`, `fetch`, or typed-array assertions, or before changing `vitest.config.ts` / `tests/unit/setup.ts`.

- **`environment: 'node'` is the default** (`pool: 'vmThreads'`). A spec needing a DOM opts in
  with a `@vitest-environment jsdom` docblock — only Monarch tokenizer specs and the DOMPurify /
  `markTextNodes` / `http-endpoint-diagnostics` / `sandboxedEval` plugin specs need it (without a
  DOM, DOMPurify sanitizes nothing). `environmentMatchGlobs` no longer exists in Vitest
- **jsdom's `location` cannot be redefined under `vmThreads`** (`defineProperty`, `stubGlobal`,
  `spyOn` all throw). Set the URL per file with `@vitest-environment-options { "url": "…" }` — so a
  different URL means a separate spec file. The default is `http://localhost:3000/`
- `navigator` is a Node global, so `navigator.languages` specs run under `node`
- `tests/unit/setup.ts` polyfills `CSS.escape` and `window.matchMedia` for Monaco. It runs for
  every spec, so keep the `matchMedia` part behind `typeof window !== 'undefined'`
- Stub `fetch` with `vi.stubGlobal('fetch', …)` and restore with `vi.unstubAllGlobals()` in
  `afterEach` (see `parseGcode.spec.ts` for a `ReadableStream` body)
- `Float32Array` reads are inexact — use `toBeCloseTo` or exactly-representable fixtures
