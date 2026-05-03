# Production static site for tower.cpss.edu.hk (NPM -> :5173)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Godot Web: export from godot/ to public/godot/ before build if you ship the WASM client.
# Project "npm run build" runs tsc first; use vite build in Docker until TS is clean
RUN npx vite build

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
