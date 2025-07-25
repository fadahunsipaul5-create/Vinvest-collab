#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Start the Cloud SQL Auth Proxy in the background


# Start Gunicorn
echo "INFO: Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080 --timeout 180

