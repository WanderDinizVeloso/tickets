FROM node:20.16-alpine

RUN apk add --no-cache bash

RUN npm i -g @nestjs/cli

USER node

WORKDIR /home/node/app
