# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Set environment variables for non-interactive Python, and expose port
ENV PYTHONUNBUFFERED 1
ENV PORT 8080
EXPOSE $PORT

# Create working directory for the app code
WORKDIR /app

# Install system dependencies needed for psycopg2-binary and other common packages
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Upgrade pip first (good practice)
RUN pip install --no-cache-dir --upgrade pip

# Copy only requirements.txt first to leverage Docker caching.
COPY requirements.txt /app/

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# --- AGGRESSIVE DEBUGGING AND REINSTALLATION STEPS (SIMPLIFIED FOR ROBUSTNESS) ---
RUN pip install --no-cache-dir --force-reinstall django-filter

# Show PYTHONPATH and sys.path
RUN python -c "import os; print('--- PYTHONPATH ---'); print(os.environ.get('PYTHONPATH', 'Not set'))"
RUN python -c "import sys; print('--- sys.path ---'); [print(p) for p in sys.path]"

# Verify installation by listing packages explicitly including location
RUN pip show django-filter

# Explicitly try to import django_filter
RUN python -c "import django_filters; print('django_filter imported successfully!')"
# --- END AGGRESSIVE DEBUGGING AND REINSTALLATION STEPS ---

# Copy the rest of your application code into the working directory
COPY . /app/

# Set environment variables for the build phase
ENV DJANGO_BUILD_ENVIRONMENT=True
ENV SECRET_KEY_BUILD_TIME="a-dummy-secret-key-for-build-only-change-me-in-prod-if-needed"

# Collect static files (this will now use SQLite via settings.py)
RUN python manage.py collectstatic --noinput

# Define the command to run your Django app with Gunicorn
CMD gunicorn --bind 0.0.0.0:${PORT} backend.wsgi:application
