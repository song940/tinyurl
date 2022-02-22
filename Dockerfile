FROM node:lts-alpine

WORKDIR /app

COPY . .

RUN npm i --production

EXPOSE 9000

CMD [ "npm", "start" ]
