ARG BASE_IMAGE=nginx:alpine-slim

FROM $BASE_IMAGE

COPY /dist /usr/share/nginx/html
COPY /server/nginx /etc/nginx/templates
