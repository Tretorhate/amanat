#!/bin/bash
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Creating system deputy (if not exists)..."
python manage.py create_not_identified_deputy || true

echo "==> Starting: $@"
exec "$@"
