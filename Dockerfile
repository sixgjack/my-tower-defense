# Production static site — Vite + Godot Web (WASM) without a local Godot install.
# Stage 1: official Godot Linux binary is glibc-linked → use Debian/Ubuntu, not Alpine.

FROM ubuntu:24.04 AS godot-web
ARG GODOT_VERSION=4.6.2
ENV DEBIAN_FRONTEND=noninteractive
ENV GODOT_SILENCE_ROOT_WARNING=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates unzip fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /tmp/godot.zip \
      "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-stable/Godot_v${GODOT_VERSION}-stable_linux.x86_64.zip" \
    && unzip -q /tmp/godot.zip -d /opt/godot-bin \
    && chmod +x "/opt/godot-bin/Godot_v${GODOT_VERSION}-stable_linux.x86_64" \
    && ln -sf "/opt/godot-bin/Godot_v${GODOT_VERSION}-stable_linux.x86_64" /usr/local/bin/godot4 \
    && rm /tmp/godot.zip

RUN curl -fsSL -o /tmp/tpl.tpz \
      "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}-stable/Godot_v${GODOT_VERSION}-stable_export_templates.tpz" \
    && unzip -q /tmp/tpl.tpz -d /tmp/tpl-extract \
    && VER="$(tr -d '\r\n' </tmp/tpl-extract/templates/version.txt)" \
    && mkdir -p "/root/.local/share/godot/export_templates/${VER}" \
    && cp -a /tmp/tpl-extract/templates/* "/root/.local/share/godot/export_templates/${VER}/" \
    && rm -rf /tmp/tpl.tpz /tmp/tpl-extract

WORKDIR /app
COPY godot ./godot
RUN mkdir -p public/godot \
    && cd godot \
    && godot4 --headless --path . --quit-after 5 \
    && godot4 --headless --export-release "Web" "../public/godot/index.html"

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY --from=godot-web /app/public/godot ./public/godot
RUN npx vite build

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
