# Sandboxed eval

Read before touching `src/plugins/sandboxedEval.ts`, `src/workers/sandboxedEval.ts`, or anything that runs user-supplied JavaScript (diagnostics collectors).

- User code runs in a `blob:` Worker inside a hidden `<iframe sandbox="allow-scripts" srcdoc>`,
  created lazily and shared. The frame's **opaque origin** keeps the code away from Fluidd's
  storage and Cache API; its `default-src 'none'` CSP meta tag, inherited by the Worker and any
  nested worker, blocks every network load. A plain `?worker` is same-origin and is **not** a sandbox
- Never add `allow-same-origin` to the frame, or `connect-src`, `'self'` or `data:` to its CSP —
  `src/workers/__tests__/sandboxedEval.spec.ts` asserts the exact policy
- `sandboxedEvalWorkerMain` and `sandboxedEvalFrameMain` are serialized with `toString` into the
  srcdoc, so they must stay **self-contained** and `src/workers/sandboxedEval.ts` **import-free** —
  an outside reference only fails at runtime. The spec runs the serialized source, which catches
  it; istanbul coverage (outside counters) would break it, v8 coverage is fine
- Each worker gets a `MessageChannel` port, passed parent → frame → worker, so requests and
  responses skip the frame. The frame only creates and terminates workers, keyed `feature:<name>`
  (reused across calls) or `request:<id>` (terminated after its one call). A timeout terminates
  the worker, so an endless loop in user code cannot freeze the page
- The sandbox guards Fluidd from collectors, not collectors from each other: `feature:metrics`
  runs all collectors in one long-lived worker, and the batch's direct `eval` lets any collector
  set the others' results or patch globals for later calls
- The srcdoc inherits the CSP of the page Fluidd is served from, so a host CSP without
  `'unsafe-inline'` blocks the frame script. A frame not `'ready'` within 5s is removed and the
  failure kept: every eval then rejects at once, with no retry until reload
- `src/plugins/__tests__/sandboxedEval.spec.ts` runs under jsdom, which never runs the srcdoc
  script — the spec announces `'ready'` itself and runs each worker in-thread on its real port
