#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Show status of all services

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏠 PropertyForSale - Service Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PostgreSQL
PGDATA="$PWD/.pgdata"
if [ -f "$PGDATA/postmaster.pid" ]; then
    echo "✅ PostgreSQL: running (port ${PGPORT:-5432})"
else
    echo "❌ PostgreSQL: stopped"
fi

# Redis
REDIS_DIR="$PWD/.redis"
if [ -f "$REDIS_DIR/redis.pid" ] && kill -0 "$(cat "$REDIS_DIR/redis.pid")" 2>/dev/null; then
    echo "✅ Redis: running (port ${REDIS_PORT:-6379})"
else
    echo "❌ Redis: stopped"
fi

# MinIO
MINIO_DIR="$PWD/.minio"
if [ -f "$MINIO_DIR/minio.pid" ] && kill -0 "$(cat "$MINIO_DIR/minio.pid")" 2>/dev/null; then
    echo "✅ MinIO: running (port ${MINIO_PORT:-9000})"
else
    echo "❌ MinIO: stopped"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
