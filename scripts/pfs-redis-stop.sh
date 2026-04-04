#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Stop Redis

REDIS_DIR="$PWD/.redis"
REDIS_PORT="${REDIS_PORT:-6379}"

if [ -f "$REDIS_DIR/redis.pid" ]; then
    echo "🛑 Stopping Redis..."
    redis-cli -p "$REDIS_PORT" shutdown 2>/dev/null || true
    rm -f "$REDIS_DIR/redis.pid"
    echo "✅ Stopped"
else
    echo "ℹ️  Redis not running"
fi
