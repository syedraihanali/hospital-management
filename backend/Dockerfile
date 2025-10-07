FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY populateAvailableTime.js ./
COPY createtable.sql ./

ENV NODE_ENV=production

EXPOSE 5001

CMD ["node", "src/server.js"]
