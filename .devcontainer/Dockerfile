# NOTE: must stay on a glibc base. typescript-native-bridge (the `typescript`
# catalog entry) ships a Go c-shared NAPI bridge with no musl build — on Alpine
# it fails to load, and segfaults even with `gcompat`. See issue #1938.
FROM node:24-trixie-slim

RUN \
  apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    wget \
    zsh \
  && usermod --shell /bin/zsh node \
  && corepack enable \
  && mkdir -p /workspaces/fluidd/node_modules /workspaces/fluidd/.pnpm-store \
  && chown -R node:node /workspaces/fluidd \
  && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspaces/fluidd

RUN sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)" "" --unattended
