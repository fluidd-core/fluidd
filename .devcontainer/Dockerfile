FROM node:24-alpine

RUN \
  apk update \
  && apk add \
    git \
    git-zsh-completion \
    sudo \
    shadow \
    zsh \
    zsh-completions \
  && echo node ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node \
  && chsh -s /bin/zsh node \
  && corepack enable \
  && su node -c 'sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"' \
  && rm -f /etc/apk/cache/* /root/.cache
