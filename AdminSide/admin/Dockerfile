# Cache Bust: 2025-12-11-01:45 - Force rebuild to clear embedded config
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql zip gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# Create missing directories and fix permissions (Critical for Laravel)
RUN mkdir -p bootstrap/cache storage/framework/views storage/framework/sessions storage/framework/cache storage/logs
RUN chmod -R 777 bootstrap/cache storage

RUN composer install --no-dev --optimize-autoloader

# Clear any cached config at runtime (not build time) to ensure env vars are read
CMD sh -c "rm -rf bootstrap/cache/*.php && php artisan serve --host=0.0.0.0 --port=8080"
