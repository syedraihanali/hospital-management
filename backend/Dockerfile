# Use an official Node.js runtime as the base image
FROM node:20-alpine AS base

WORKDIR /app

# Install production dependencies based on the lockfile for reproducible builds
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application source
COPY src ./src
COPY populateAvailableTime.js ./
COPY createtable.sql ./

ENV NODE_ENV=production

EXPOSE 5001

# Start the API server
CMD ["node", "src/server.js"]
