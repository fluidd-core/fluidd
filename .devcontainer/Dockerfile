# NOTE: must stay on a glibc base. typescript-native-bridge (the `typescript`
# catalog entry) ships a Go c-shared NAPI bridge with no musl build — on Alpine
# it fails to load, and segfaults even with `gcompat`. See issue #1938.
# ghcr.io/pnpm/pnpm is Debian-based and ships only the pnpm binary
# (PNPM_HOME=/pnpm, /pnpm/bin on PATH); Node.js comes from devEngines.runtime
# in package.json, downloaded by pnpm on first use.
FROM ghcr.io/pnpm/pnpm:12

RUN \
  apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    wget \
    zsh \
  && useradd --create-home --shell /bin/zsh --uid 1000 node \
  && chown -R node:node /pnpm \
  && mkdir -p /workspaces/fluidd/node_modules /workspaces/fluidd/.pnpm-store \
  && chown -R node:node /workspaces/fluidd \
  && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspaces/fluidd

RUN sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)" "" --unattended
