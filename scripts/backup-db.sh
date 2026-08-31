#!/usr/bin/env bash
# Backs up the linked Supabase database: schema, data, and roles, each as a
# separate .sql file so a partial restore (e.g. data-only) stays possible.
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/backups/$TIMESTAMP"
mkdir -p "$OUT_DIR"

echo "Backing up linked Supabase project to $OUT_DIR"

supabase db dump --linked -f "$OUT_DIR/schema.sql"
supabase db dump --linked --data-only -f "$OUT_DIR/data.sql"
supabase db dump --linked --role-only -f "$OUT_DIR/roles.sql"

# Keep only the N most recent backups locally.
KEEP=10
cd "$ROOT_DIR/backups"
ls -1dt */ 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf --

echo "Backup complete: $OUT_DIR"
