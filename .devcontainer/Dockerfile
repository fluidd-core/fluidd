FROM alpine:3.18

RUN \
  apk update \
  && apk add \
    openssh \
    nodejs \
    npm \
    git \
    zsh \
    git-zsh-completion \
    zsh-completions \
  && rm -f /etc/apk/cache/* /root/.cache \
  && sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
