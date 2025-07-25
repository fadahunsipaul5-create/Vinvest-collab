# Use the official Google Cloud SDK as a base
FROM google/cloud-sdk:slim

# Install the Docker client
RUN apt-get update && apt-get install -y docker-ce-cli

# Download and install the Cloud SQL Auth Proxy
RUN curl -o /usr/local/bin/cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.10.0/cloud-sql-proxy.linux.amd64 && \
    chmod +x /usr/local/bin/cloud-sql-proxy

# Verify installations
RUN cloud-sql-proxy --version
RUN docker --version
