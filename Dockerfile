# ── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack for pnpm package manager
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install dependencies strictly from lockfile
RUN pnpm install --frozen-lockfile

# Optional build arg for API base URL if hardcoded at build time (defaults to dynamic /api)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy source code and build config
COPY . .

# Run production build (TypeScript + Vite + PWA assets)
RUN pnpm build

# ── Stage 2: Production Web Server (Nginx) ─────────────────────────────
FROM nginx:alpine

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx template for Dokploy environment variables substitution
# The official nginx entrypoint automatically substitutes ${VAR} in /etc/nginx/templates/
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default runtime environment variables for Dokploy
ENV PORT=80
ENV API_URL=http://roma-backend:8080

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
