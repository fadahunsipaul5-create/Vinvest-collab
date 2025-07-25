# Final, Correct Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# The Cloud SQL Proxy does NOT need to be installed here.
# Cloud Run provides it automatically.

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app

# The startup.sh script is responsible for starting the gunicorn process
CMD ["/app/startup.sh"]
