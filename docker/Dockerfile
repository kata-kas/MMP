# Stage 1: Build Go agent
FROM golang:1.22 AS agent-builder

WORKDIR /build
COPY apps/agent/go.mod apps/agent/go.sum ./
RUN go mod download

COPY apps/agent/ .
RUN go build -o main main.go

# Stage 2: Build React UI
FROM node:20.10 AS ui-builder

WORKDIR /build
COPY apps/ui/package*.json ./
RUN npm ci

COPY apps/ui/ .
RUN npm run build

# Stage 3: Runtime with Caddy
FROM caddy:2.4.6

# Install ca-certificates for Go binary
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy agent binary
COPY --from=agent-builder /build/main /app/agent

# Copy UI build
COPY --from=ui-builder /build/dist /app/dist

# Copy Caddyfile
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh

# Create data directories
RUN mkdir -p /data/temp /data/assets

# Make agent and entrypoint executable
RUN chmod +x /app/agent /entrypoint.sh

# Expose ports
EXPOSE 8081 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/ || exit 1

# Use entrypoint script to run both services
ENTRYPOINT ["/entrypoint.sh"]
