FROM nginx:alpine

ENV PORT=80

COPY /dist /usr/share/nginx/html
COPY /server/nginx /etc/nginx/templates
