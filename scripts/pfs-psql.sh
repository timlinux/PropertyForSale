#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Connect to PostgreSQL
# Requires: POSTGRES_BIN_DIR to be set

: "${POSTGRES_BIN_DIR:?POSTGRES_BIN_DIR must be set}"

PGDATA="$PWD/.pgdata"
PGPORT="${PGPORT:-5432}"
DB_NAME="${DB_NAME:-propertyforsale}"

exec "$POSTGRES_BIN_DIR/psql" -h "$PGDATA" -p "$PGPORT" -d "$DB_NAME" "$@"
