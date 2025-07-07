#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Start the Cloud SQL Auth Proxy in the background
echo "INFO: Starting Cloud SQL Proxy..."
cloud-sql-proxy --private-ip getdeepaiapp:us-central1:sec-db &

# Wait a few seconds for the proxy to initialize
sleep 5

# Start Gunicorn
echo "INFO: Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8080 --timeout 180

