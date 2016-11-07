# product
FROM ubuntu:14.04
MAINTAINER Wei Fu, wfu@ncsu.edu

RUN apt-get update && apt-get -y install git
RUN apt-get -y install nodejs
RUN apt-get -y install npm
RUN git clone https://github.com/WeiFoo/auto_deploy.git
COPY ./auto_deploy/app /app
RUN cd /app; npm install
EXPOSE 3000
WORKDIR auto_deploy/app
CMD ["nodejs", "app.js"]