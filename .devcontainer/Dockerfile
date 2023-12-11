FROM alpine:3.18

RUN \
  apk update \
  && apk add \
    git \
    git-zsh-completion \
    nodejs \
    npm \
    openssh \
    sudo \
    shadow \
    zsh \
    zsh-completions \
  && rm -f /etc/apk/cache/* /root/.cache \
  && groupadd vscode \
  && useradd -s /bin/zsh --gid vscode -m vscode \
  && echo vscode ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/vscode \
  && chmod 0440 /etc/sudoers.d/vscode \
  && mkdir -p "/home/vscode" \
  && chown vscode:vscode "/home/vscode"

USER vscode

RUN \
  sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
