ARG BASE_IMAGE=nginx:alpine-slim

FROM $BASE_IMAGE

ARG PORT=80
ENV PORT=${PORT}

COPY /dist /usr/share/nginx/html
COPY /server/nginx /etc/nginx/templates

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=2s --retries=3 \
  CMD wget -q -O /dev/null -T 2 "http://127.0.0.1:${PORT}/healthz" || exit 1
