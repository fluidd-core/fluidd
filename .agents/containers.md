# Dev container & Docker images

Read before touching `.devcontainer/`, `Dockerfile`, or `server/nginx/`.

## Dev Container

- Bundles a `docker-klipper-simulavr` container: Klipper/Moonraker on port 7125, Fluidd on 8080
- Base image `mcr.microsoft.com/devcontainers/javascript-node:26` **must stay glibc** —
  `typescript-native-bridge` has no musl build and segfaults on Alpine even with `gcompat`
- No Dockerfile: `docker-compose.yml` uses the image directly. The service sets `user: node` and
  `working_dir` because `remoteUser` only covers VS Code; a root `pnpm i` from `docker compose
  exec` would leave files `node` can't write
- `node_modules` is a named volume (root-owned when fresh), so `postCreateCommand` runs
  `sudo chown node:node node_modules` (not recursive) then `pnpm i --frozen-lockfile`. pnpm's
  store lives inside it (`node_modules/.pnpm-store`), so hard links work and it survives rebuilds
- A bare `node` is the image's version and can lag the pin; anything run through pnpm uses
  `devEngines.runtime`

## Docker Images (production)

- `Dockerfile` builds on `nginx:alpine-slim` (`fluidd`) or `nginxinc/nginx-unprivileged:alpine-slim`
  (`fluidd-unprivileged`) via a `BASE_IMAGE` build arg (`_publish-docker.yml` matrix)
- `PORT` (default `80`) is a build arg re-exported as `ENV PORT` and substituted into
  `server/nginx/default.conf.template` by nginx's envsubst entrypoint at **container start**, so
  `docker run` can override it
- `HEALTHCHECK` uses `wget` against `/healthz` (plain `200 ok`, not access-logged) — the base image
  must keep `wget`
