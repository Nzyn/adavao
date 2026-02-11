#!/bin/bash

# Render Deployment Script
# This script runs automatically when deploying to Render

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# Fix missing is_read column (emergency fix)
echo "🔧 Applying database fixes..."
php artisan db:fix-columns

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Recalculate urgency scores
echo "🔄 Updating urgency scores..."
php artisan reports:recalculate-urgency

# Clear and cache config
echo "⚡ Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Deployment complete!"
