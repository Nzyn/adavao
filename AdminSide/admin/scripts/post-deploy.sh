#!/bin/bash

# Post-deployment cleanup script
# This runs automatically after each Render deployment

echo "🧹 Running post-deployment cleanup..."

# Delete duplicate users that may cause unique constraint violations
php artisan tinker --execute="
try {
    \$deleted = DB::table('users_public')->where('email', 'dansoypatrol@mailsac.com')->delete();
    if (\$deleted > 0) {
        echo '✅ Deleted duplicate user: dansoypatrol@mailsac.com\n';
    } else {
        echo 'ℹ️  No duplicate user found\n';
    }
} catch (Exception \$e) {
    echo '⚠️  Cleanup error: ' . \$e->getMessage() . '\n';
}
"

echo "✅ Post-deployment cleanup complete"
