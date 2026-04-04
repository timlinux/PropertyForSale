#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Start all development services (PostgreSQL, Redis, MinIO)
set -euo pipefail

SCRIPTS_DIR="$(dirname "$0")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏠 PropertyForSale - Starting Development Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pfs-pg-start
pfs-redis-start
pfs-minio-start

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services started!"
echo ""
echo "Now run:"
echo "  pfs-backend   - Start Go API server (port 8080)"
echo "  pfs-frontend  - Start React dev server (port 5173)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
