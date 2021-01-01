FROM nginx

RUN apt update -qq && apt install -y unzip
WORKDIR /usr/share/nginx/html
RUN curl -L https://github.com/cadriel/fluidd/releases/latest/download/fluidd.zip -o fluidd.zip
RUN unzip -o fluidd.zip
