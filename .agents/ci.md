# CI & GitHub workflows

Read before touching `.github/` or `tools/bundle-size.mjs`.

- `.github/actions/setup-pnpm-node` wraps `pnpm/setup` (`install: false`, `cache: true`) and
  installs pnpm and Node from `devEngines`. `bundle-baseline` uses it too, so its
  `sparse-checkout` lists `.github/actions` alongside `tools` (cone mode checks out root files but
  no other directory)
- Pipeline: `pnpm i --frozen-lockfile` → `lint --no-fix` → `type-check` → `test:unit` →
  `circular-check` → `build`. The three middle checks carry `if: ${{ !cancelled() }}` so one run
  reports all four; `build` and the artifact upload deliberately don't
- `_build.yml`, `_publish-docker.yml`, `_publish-web.yml` are `workflow_call` workflows, called by
  `ci.yml` (PRs, `develop`/`master` pushes) and `release.yml` (`v*` tags). A calling job's
  `permissions:` is a **ceiling** on the called workflow's token — every calling job needs its own
  block. Secrets can't cross via `with:`; `_publish-web.yml` uses `on.workflow_call.secrets`
- Bundle-size report: `tools/bundle-size.mjs` (zero-dependency) diffs gzip sizes against the
  merge-base; `pr-comment.yml` posts it. It's a separate `workflow_run` workflow because building
  PR code can't hold a write token; it reads only an artifact and takes the PR number from
  `pr-number.txt` (`pull_requests[]` is empty for forks). `workflows: ['CI']` must match
  `ci.yml`'s `name:`, and the trigger only fires once the file is on the default branch
- Baselines are cached by `bundle-size-<hash of tools/bundle-size.mjs>-<sha>` — the manifest format
  isn't versioned, so the tool hash keeps a format change from poisoning cached baselines into
  `NaN B` tables. `compare` also rejects non-finite entries. The compare step needs `shell: bash`
  for `pipefail`, or `tee` masks a failure
