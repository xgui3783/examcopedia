FROM node:6
COPY . /examcopedia
WORKDIR /examcopedia

RUN npm install
ENTRYPOINT ["node","server.js"]