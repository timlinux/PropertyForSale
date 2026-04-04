#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Run the Go backend server
set -euo pipefail

cd "$PWD/backend"

# Set environment variables
export ENV="${ENV:-development}"
export SERVER_PORT="${SERVER_PORT:-8080}"
export DATABASE_URL="postgres://$USER@localhost:${PGPORT:-5432}/${DB_NAME:-propertyforsale}?sslmode=disable&host=$PWD/.pgdata"
export REDIS_URL="redis://localhost:${REDIS_PORT:-6379}"
export MINIO_ENDPOINT="localhost:${MINIO_PORT:-9000}"
export MINIO_ACCESS_KEY="${MINIO_ROOT_USER:-minioadmin}"
export MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD:-minioadmin}"
export MINIO_USE_SSL="false"
export MINIO_BUCKET="propertyforsale"
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-in-production}"

echo "🚀 Starting Go backend on port $SERVER_PORT..."
exec go run ./cmd/server
