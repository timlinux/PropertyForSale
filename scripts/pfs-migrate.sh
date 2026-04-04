#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Run database migrations
set -euo pipefail

: "${POSTGRES_BIN_DIR:?POSTGRES_BIN_DIR must be set}"

PGDATA="$PWD/.pgdata"
PGPORT="${PGPORT:-5432}"
DB_NAME="${DB_NAME:-propertyforsale}"
MIGRATIONS_DIR="$PWD/backend/migrations"

echo "🔄 Running migrations..."

for migration in "$MIGRATIONS_DIR"/*.up.sql; do
    if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        "$POSTGRES_BIN_DIR/psql" -h "$PGDATA" -p "$PGPORT" -d "$DB_NAME" -f "$migration"
    fi
done

echo "✅ Migrations complete"
