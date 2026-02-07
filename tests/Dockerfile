# Test environment for dx binary
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install minimal dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Create non-root test user
RUN useradd -m -s /bin/bash testuser

# Copy dx binary
COPY dx-binary /usr/local/bin/dx
RUN chmod +x /usr/local/bin/dx

# Switch to test user
USER testuser
WORKDIR /home/testuser

# Set up dvm directory structure and environment
RUN mkdir -p /home/testuser/.dvm/versions /home/testuser/.dvm/cache

ENV DVM_DIR=/home/testuser/.dvm
ENV DOTNET_ROOT=/home/testuser/.dvm/current
ENV PATH="/home/testuser/.dvm/current:${PATH}"

# Copy test script
COPY test-sdk.sh /home/testuser/test-sdk.sh

CMD ["/bin/bash", "/home/testuser/test-sdk.sh"]
