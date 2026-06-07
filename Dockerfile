# syntax=docker/dockerfile:1

# ---- Build stage: prerender the static site with vite-react-ssg ----
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first so this layer caches unless the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static site. VITE_SITE_URL bakes canonical URLs, sitemap and RSS
# origins (see src/seo/config.ts); default matches the production domain so a
# plain build is still correct.
ARG VITE_SITE_URL=https://mattschoe.dev
ENV VITE_SITE_URL=$VITE_SITE_URL
COPY . .
RUN npm run build

# ---- Runtime stage: nginx serving the prerendered dist/ ----
FROM nginx:1.27-alpine AS runtime
# Replace the default server block with our clean-URL / caching config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx:alpine's default CMD already runs nginx in the foreground.
