FROM node:10 as builder
COPY . /app
WORKDIR /app

ARG BACKENDURL
ENV BACKENDURL=$BACKENDURL

RUN npm i
RUN npm run build

FROM node:10-alpine

ENV NODE_ENV=production

RUN mkdir /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server /app/server

WORKDIR /app/server
RUN npm i
ENTRYPOINT [ "npm", "start" ]