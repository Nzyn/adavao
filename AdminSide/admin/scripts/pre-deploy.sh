#!/bin/bash

# Pre-deployment cleanup script
# This runs during the build process on Render

echo "🧹 Running pre-deployment cleanup..."

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
    echo '⚠️  Cleanup error (non-fatal): ' . \$e->getMessage() . '\n';
}
"

echo "✅ Pre-deployment cleanup complete"
