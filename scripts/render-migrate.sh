#!/usr/bin/env bash
set -euo pipefail

# Runs DB migrations on deploy (Render)
# - Safe to re-run on every redeploy
# - Uses Laravel migrations (php artisan migrate --force)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADMIN_DIR="$ROOT_DIR/AdminSide/admin"

if [[ ! -f "$ADMIN_DIR/artisan" ]]; then
  echo "❌ Could not find Laravel artisan at: $ADMIN_DIR/artisan" >&2
  exit 1
fi

echo "🚀 Running Laravel migrations (Render deploy)…"
cd "$ADMIN_DIR"

# If your DB connection is not ready yet, Render will restart the service and this will run again.
php artisan migrate --force

echo "✅ Migrations complete."

# Run essential seeders (safe to re-run - uses insertOrIgnore)
echo "🌱 Running essential seeders..."
php artisan db:seed --class=RolesTableSeeder --force
php artisan db:seed --class=PoliceStationsSeeder --force 2>/dev/null || echo "   PoliceStationsSeeder skipped (may not be needed)"

echo "✅ Seeders complete."