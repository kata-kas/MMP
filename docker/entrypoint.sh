#!/bin/sh
set -e

# Start agent in background
/app/agent &

# Wait a moment for agent to start
sleep 2

# Start Caddy in foreground
exec caddy run --config /etc/caddy/Caddyfile
