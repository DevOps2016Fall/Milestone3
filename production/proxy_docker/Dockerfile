# proxy
FROM ubuntu:14.04
MAINTAINER Wei	Fu, wfu@ncsu.edu

RUN apt-get update
RUN apt-get -y install git
RUN apt-get -y install nodejs
RUN apt-get -y install nodejs-legacy
RUN apt-get -y install npm
RUN apt-get -y install wget
COPY ./auto_deploy/app /app
RUN npm install n -g
RUN n 0.10.33
RUN cd /app; npm install
RUN npm install http-server -g
EXPOSE 3000
EXPOSE 8080
WORKDIR /app
CMD ["node", "proxy.js"]