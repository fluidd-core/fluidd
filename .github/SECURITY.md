# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities through
[GitHub's private vulnerability reporting](https://github.com/fluidd-core/fluidd/security/advisories/new).

**Please do not report vulnerabilities through public issues, pull requests, or
Discord.** Private reporting lets us assess and fix an issue before it becomes
public knowledge.

Helpful things to include:

- The Fluidd version (shown in the bottom right corner, e.g. `v1.37.3-bc79728`)
- Your browser and operating system
- Your Moonraker version, if the issue involves communication with the printer
- Steps to reproduce, ideally minimal
- What an attacker could achieve — the impact matters more than the mechanism

Fluidd is maintained by volunteers, so we do not commit to a response deadline.
Reports are reviewed as maintainers are available.

## Scope

Fluidd is a browser application with no server-side component of its own. It is
served as static files and talks to
[Moonraker](https://github.com/Arksine/moonraker), which is where
authentication, network exposure and printer access are actually enforced. That
boundary determines what belongs here:

| In scope                                                                       | Out of scope                                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cross-site scripting via G-code, filenames, console output or macro parameters | Moonraker itself — report to [Arksine/moonraker](https://github.com/Arksine/moonraker/security)                                                        |
| The sandboxed evaluation worker (`src/workers/sandboxedEval.worker.ts`)        | Klipper itself — report to [Klipper3d/klipper](https://github.com/Klipper3d/klipper/security)                                                          |
| Sanitization bypasses in `v-safe-html` (`src/directives/safe-html.ts`)         | "Fluidd has no login" — authentication is Moonraker's `[authorization]`, see the [Authorization docs](https://docs.fluidd.xyz/features/authorization/) |
| Token handling — JWT storage and refresh, oneshot tokens                       | A printer deliberately exposed to the internet without a reverse proxy or VPN                                                                          |
| The published container images under `ghcr.io/fluidd-core`                     | Dependency scanner output with no demonstrated exploit path in Fluidd                                                                                  |
| The hosted instance at [app.fluidd.xyz](https://app.fluidd.xyz)                |                                                                                                                                                        |

If you are unsure which side of that line a finding falls on, report it anyway
and we will redirect it.

## Dependencies and Vue 2

Fluidd is built on Vue 2, which reached end of life in December 2023. This is a
known and deliberately managed constraint: the Vue 2 packages are pinned, and
the project accepts responsibility for assessing their risk rather than
inheriting fixes from upstream.

We will assess any reported vulnerability in a dependency for whether it is
exploitable **in the way Fluidd actually uses that dependency**. A match in an
advisory database, or a scanner report listing an affected package version, is
not on its own a vulnerability report — please include the path by which it can
be reached through Fluidd.

## Supported versions

Only the most recent release receives security fixes. There are no maintained
release branches, so fixes ship in the next release rather than being backported.

## Coordinated disclosure

We will work with you through the private advisory: confirming the issue,
preparing a fix, and publishing an advisory when the fix is released. Reporters
are credited in the published advisory unless they would rather not be. We will
not ask you to delay disclosure indefinitely, and we ask that you give us a
reasonable opportunity to ship a fix first.

## Verifying release artifacts

Fluidd's release artifacts carry signed build provenance, so you can confirm a
download was built by this repository's CI and not modified afterwards. This
requires the [GitHub CLI](https://cli.github.com/).

For a container image:

```bash
gh attestation verify oci://ghcr.io/fluidd-core/fluidd:latest-master -R fluidd-core/fluidd
```

For a release archive — attested for releases published after `v1.37.3`:

```bash
gh attestation verify fluidd.zip -R fluidd-core/fluidd
```
