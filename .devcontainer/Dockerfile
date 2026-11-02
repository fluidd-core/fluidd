# NOTE: must stay on a glibc base. typescript-native-bridge (the `typescript`
# catalog entry) ships a Go c-shared NAPI bridge with no musl build — on Alpine
# it fails to load, and segfaults even with `gcompat`. See issue #1938.
FROM mcr.microsoft.com/devcontainers/javascript-node:26

# Named volumes inherit this ownership on first creation
RUN \
  mkdir -p /workspaces/fluidd/node_modules \
  && chown -R node:node /workspaces/fluidd

USER node
WORKDIR /workspaces/fluidd
