#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Start MinIO for development (S3-compatible storage)
set -euo pipefail

MINIO_DIR="$PWD/.minio"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_CONSOLE_PORT="${MINIO_CONSOLE_PORT:-9001}"

mkdir -p "$MINIO_DIR/data"

if [ -f "$MINIO_DIR/minio.pid" ] && kill -0 "$(cat "$MINIO_DIR/minio.pid")" 2>/dev/null; then
    echo "✅ MinIO already running"
    exit 0
fi

export MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"

echo "🚀 Starting MinIO..."
nohup minio server "$MINIO_DIR/data" \
    --address ":$MINIO_PORT" \
    --console-address ":$MINIO_CONSOLE_PORT" \
    > "$MINIO_DIR/minio.log" 2>&1 &

echo $! > "$MINIO_DIR/minio.pid"
sleep 2

if curl -s "http://localhost:$MINIO_PORT/minio/health/live" > /dev/null; then
    echo "✅ MinIO running"
    echo "   API: http://localhost:$MINIO_PORT"
    echo "   Console: http://localhost:$MINIO_CONSOLE_PORT"
    echo "   User: $MINIO_ROOT_USER / Password: $MINIO_ROOT_PASSWORD"
else
    echo "❌ Failed to start MinIO"
    cat "$MINIO_DIR/minio.log"
    exit 1
fi
