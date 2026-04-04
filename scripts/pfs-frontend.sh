#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
# Run the frontend dev server
set -euo pipefail

cd "$PWD/frontend"

echo "🚀 Starting frontend dev server..."
exec npm run dev
