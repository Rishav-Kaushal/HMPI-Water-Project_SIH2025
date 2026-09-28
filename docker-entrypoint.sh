#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py seed_standards
exec gunicorn hmpi_system.wsgi:application --bind 0.0.0.0:8000 --workers "${GUNICORN_WORKERS:-2}" --timeout "${GUNICORN_TIMEOUT:-60}"
