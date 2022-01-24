FROM nginx:alpine

ENV JPEG_STREAM_HOST=localhost \
    JPEG_STREAM_PORT=8080

COPY --chown=101:101 server/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 dist /usr/share/nginx/html
EXPOSE 80
