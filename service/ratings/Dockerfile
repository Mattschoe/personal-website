# Two-stage build: compile better-sqlite3's native addon against musl in a
# builder that has the toolchain, then copy just the runtime into a clean
# node:22-alpine. Keeps the final image free of python3/make/g++.

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
# Reproducible install of production deps only (builds better-sqlite3 from source).
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    RATINGS_DATA=/data/ratings.db \
    PORT=8080
# Mount point for the SQLite database (a named podman volume in production).
RUN mkdir -p /data
COPY --from=build /app/node_modules ./node_modules
COPY package.json store.mjs server.mjs ./
EXPOSE 8080
CMD ["node", "server.mjs"]
