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
  && su node -c 'sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"' \
  && su node -c 'wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.zshrc" SHELL="$(which zsh)" zsh - && source ~/.zshrc && pnpm config set store-dir /home/node/.local/share/pnpm/store' \
  && rm -f /etc/apk/cache/* /root/.cache
