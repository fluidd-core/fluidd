FROM alpine:3.18

RUN apk update
RUN apk add openssh nodejs npm git zsh git-zsh-completion zsh-completions

RUN sh -c "$(wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
