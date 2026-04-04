#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Stop MinIO

MINIO_DIR="$PWD/.minio"

if [ -f "$MINIO_DIR/minio.pid" ]; then
    echo "🛑 Stopping MinIO..."
    kill "$(cat "$MINIO_DIR/minio.pid")" 2>/dev/null || true
    rm -f "$MINIO_DIR/minio.pid"
    echo "✅ Stopped"
else
    echo "ℹ️  MinIO not running"
fi
