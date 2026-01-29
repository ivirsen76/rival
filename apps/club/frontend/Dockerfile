FROM node:20.19.4-alpine

WORKDIR /app/src/server

COPY src/server ./

RUN npm install

COPY dist /app/dist
COPY gitcommit /app/

CMD ["npm", "run", "start:prod"]

EXPOSE 3030