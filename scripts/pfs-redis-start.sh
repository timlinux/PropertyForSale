#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Start Redis for development
set -euo pipefail

REDIS_DIR="$PWD/.redis"
REDIS_PORT="${REDIS_PORT:-6379}"

mkdir -p "$REDIS_DIR"

if [ -f "$REDIS_DIR/redis.pid" ] && kill -0 "$(cat "$REDIS_DIR/redis.pid")" 2>/dev/null; then
    echo "✅ Redis already running"
    exit 0
fi

echo "🚀 Starting Redis..."
redis-server --daemonize yes \
    --port "$REDIS_PORT" \
    --dir "$REDIS_DIR" \
    --pidfile "$REDIS_DIR/redis.pid" \
    --logfile "$REDIS_DIR/redis.log"

sleep 1
if redis-cli -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "✅ Redis running on port $REDIS_PORT"
else
    echo "❌ Failed to start Redis"
    exit 1
fi
