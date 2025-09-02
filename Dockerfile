ARG BASE_IMAGE=nginx:alpine
ARG PORT=80

FROM $BASE_IMAGE

ARG PORT

ENV PORT=$PORT

COPY /dist /usr/share/nginx/html
COPY /server/nginx /etc/nginx/templates
