FROM alpine:latest as unzip

ARG FRONTEND_ZIP_URL=https://github.com/fluidd-core/fluidd/releases/latest/download/fluidd.zip

WORKDIR /frontend

ADD ${FRONTEND_ZIP_URL} /tmp/frontend.zip
RUN unzip /tmp/frontend.zip -d /frontend

FROM nginx:alpine

ENV JPEG_STREAM_HOST localhost
ENV JPEG_STREAM_PORT 8080

COPY --chown=101:101 server/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY --from=unzip --chown=101:101 /frontend /usr/share/nginx/html
COPY --chown=101:101 server/config.json /usr/share/nginx/html/config.json
EXPOSE 80
