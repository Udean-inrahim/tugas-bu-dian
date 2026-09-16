#!/bin/sh
set -e

echo ">> Starting Mosquitto broker..."
/usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf &

sleep 2

cd /app/backend

echo ">> Applying database migrations..."
npx prisma migrate deploy

echo ">> Seeding database..."
npx tsx prisma/seed.ts

echo ">> Starting backend..."
exec npm start