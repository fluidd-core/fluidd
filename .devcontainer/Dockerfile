FROM node:24-alpine

RUN \
  apk update \
  && apk add \
    git \
    git-zsh-completion \
    zsh \
    zsh-completions \
  && sed -i 's|/bin/ash|/bin/zsh|' /etc/passwd \
  && corepack enable \
  && mkdir -p /workspaces/fluidd/node_modules \
  && chown -R node:node /workspaces/fluidd \
  && rm -f /etc/apk/cache/* /root/.cache

USER node
WORKDIR /workspaces/fluidd

RUN sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)" "" --unattended
