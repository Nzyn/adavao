# Cache Bust: 2025-12-11-02:09 - FORCE COMPLETE REBUILD
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql zip gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# AGGRESSIVE: Delete ALL cache files immediately to prevent 'forge' persistence
RUN rm -rf bootstrap/cache/* storage/framework/cache/* storage/framework/views/* || true

# Create missing directories and fix permissions (Critical for Laravel)
RUN mkdir -p bootstrap/cache storage/framework/views storage/framework/sessions storage/framework/cache storage/logs
RUN chmod -R 777 bootstrap/cache storage

RUN composer install --no-dev --optimize-autoloader

# DIAGNOSTIC: Output env vars to build log
RUN echo "=== DIAGNOSTIC ENV VARS ===" && \
    echo "DB_HOST=${DB_HOST:-NOT_SET}" && \
    echo "DB_PORT=${DB_PORT:-NOT_SET}" && \
    echo "DB_DATABASE=${DB_DATABASE:-NOT_SET}" && \
    echo "DB_USERNAME=${DB_USERNAME:-NOT_SET}" && \
    echo "DB_PASSWORD=${DB_PASSWORD:+SET}" && \
    echo "=== END DIAGNOSTIC ==="

# Clear any cached config at runtime (not build time) to ensure env vars are read
CMD sh -c "rm -rf bootstrap/cache/*.php storage/framework/cache/data/* && php artisan config:clear && php artisan serve --host=0.0.0.0 --port=8080"
