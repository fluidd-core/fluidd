# Contributing to Fluidd

Fluidd is an independent web client for [Klipper](https://github.com/Klipper3d/klipper)
(via [Moonraker](https://github.com/Arksine/moonraker)), built with Vue 2.7 and TypeScript.

Contributions of all kinds are welcome — bug reports, feature requests, code, and
translations. This document covers the process and rules. For setup instructions and a
tour of the codebase, see the
[Development guide](https://docs.fluidd.xyz/development/).

## Before you start

- Read the [Development guide](https://docs.fluidd.xyz/development/) — it covers the
  Dev Container, running Fluidd locally, and a quick architecture overview.
- After cloning, run `pnpm i --frozen-lockfile && pnpm run bootstrap` to install dependencies and set up
  the Git hooks that pre-validate your commits. If you don't have pnpm yet, run `corepack enable`
  first — see the [Development guide](https://docs.fluidd.xyz/development/) for details.

## Branching and pull requests

- Create your work on a feature branch from `develop` — for example,
  `feat/my-feature` branched from `develop`. Do not open pull requests from
  `develop` or `master` directly.
- **Pull request titles must follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)**.
  This is enforced by CI.
- Accepted pull requests are squashed and rebased onto `develop` when merged.

## Commits

- Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for every
  commit message. Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
  `test`, `build`, `ci`, `chore`, `revert`, `types`, `i18n`.
- The commit subject must be **50 characters or fewer** — enforced by the
  `commit-msg` Git hook.
- Every commit must include a `Signed-off-by` line. The easiest way is to commit with
  `git commit -s`. Signing off acknowledges the
  [Developer Certificate of Origin](./developer-certificate-of-origin) and must
  contain your real name and a current email address. Example:

  ```text
  feat: my feature

  Some description of what changed and why.

  Signed-off-by: Your Name <your@email>
  ```

## Code quality

Source must pass linting and type-checking with **zero warnings and zero type errors**.
Before pushing, run:

```bash
pnpm run lint
pnpm run type-check
pnpm run test
```

CI runs the same checks (plus `pnpm run circular-check` and a production build) on
every pull request.

## Translations

Translations are managed via [Weblate](https://hosted.weblate.org/engage/fluidd/) — do
not edit non-English files in `src/locales/` directly. New strings should be added to
`src/locales/en.yaml`; Weblate handles the rest. See the
[Localization section](https://docs.fluidd.xyz/development/#localization) of the
Development guide for more.

## A note on `CLAUDE.md`

The `CLAUDE.md` file in the repository root is an exhaustive reference written for AI
coding assistants (Claude Code, Cursor, and similar tools). It documents architecture,
patterns, and gotchas in detail. Humans are welcome to read it as a deeper second
source, but the canonical onboarding doc for human contributors is the
[Development guide](https://docs.fluidd.xyz/development/).
