FROM mhart/alpine-node:12.4.0

MAINTAINER Thanh Vu

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --production

COPY . .

EXPOSE 1337

CMD ["node", "--experimental-modules", "index.js"]
