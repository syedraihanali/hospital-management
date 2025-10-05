# Build stage: compile the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# Use npm install because the project does not commit a package-lock.json
# which makes npm ci fail.
RUN npm install

COPY . .

# Allow the API URL to be injected at build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Production stage: serve the static files with Nginx
FROM nginx:1.27-alpine AS production

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
