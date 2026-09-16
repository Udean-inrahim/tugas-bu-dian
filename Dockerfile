# Smart Temperature Monitoring - 24/7 deployment image
# Runs backend (Fastify) + static frontend + Mosquitto broker in one container.

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    mosquitto \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy sources
COPY backend ./backend
COPY frontend ./frontend
COPY docker/mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Install + build backend
RUN cd backend && npm ci && npm run build

# Install + build frontend
RUN cd frontend && npm ci && npm run build

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]