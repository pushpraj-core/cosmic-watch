# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production (Serve with Caddy)
FROM caddy:2-alpine

# Copy built app from builder
COPY --from=builder /app/dist /srv

# Expose port
EXPOSE 3000

# Caddy config for SPA
COPY <<EOF /etc/caddy/Caddyfile
:3000 {
  file_server
  try_files {path} /index.html
}
EOF

# Default command
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
