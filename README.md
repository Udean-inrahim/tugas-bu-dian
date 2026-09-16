# Smart Temperature Monitoring

IoT dashboard untuk memantau suhu dan kelembapan secara real-time (ESP32 + DHT22, MQTT, WebSocket).

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts + Zustand
- **Backend**: Node.js + Fastify + TypeScript + Prisma + MQTT + WebSocket
- **Database**: PostgreSQL
- **Broker**: Mosquitto (MQTT)

## Architecture

```
ESP32 (DHT22) ──Wi-Fi──▶ MQTT Broker ──▶ Backend ──▶ PostgreSQL
                                            │
                        Frontend (WebSocket) ◀──┘
```

## Prerequisites

- Node.js 18+
- Database & broker — pilih salah satu:
  - **Docker + Docker Compose** (rekomendasi di Linux/macOS), **atau**
  - **PostgreSQL + Mosquitto native** (Windows — lihat di bawah)
- Prisma CLI (bundled via `npx prisma`)

## Getting Started

### 1. Environment & infrastructure

**Opsi A — Docker Compose:**

```bash
cp .env.example .env
docker compose up -d       # PostgreSQL:5432 + Mosquitto:1883/9001
```

**Opsi B — Native Windows (tanpa Docker/WSL):**

```powershell
# 1) PostgreSQL 16 — install lalu daftarkan service
#    bin: C:\PostgreSQL\16\bin (tambahkan ke PATH)
pg_ctl register -N postgresql-x64-16 -D C:\PostgreSQL\data -o "-p 5432"
sc.exe start postgresql-x64-16

# 2) Buat user & database (sesuai .env)
psql -U postgres -h localhost -p 5432 -c "CREATE ROLE stm LOGIN PASSWORD 'stm_password';"
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE smart_temperature OWNER stm;"

# 3) Mosquitto (winget install EclipseFoundation.Mosquitto) — service `mosquitto`
#    Pastikan C:\Program Files\mosquitto\mosquitto.conf berisi listener 1883 (mqtt)
#    dan 9001 (websockets) + allow_anonymous true (lihat mosquitto/config/mosquitto.conf)
Restart-Service mosquitto
```

Salin `.env.example` ke `.env` (root) dan pastikan `backend/.env` memuat `DATABASE_URL` yang sama.

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Default admin account (created by seed):
- Email: `admin@example.com`
- Password: `admin123`

## MQTT Topics

| Topic | Payload | Description |
|---|---|---|
| `sensors/{sensor_code}/data` | `{"temperature": 28.5, "humidity": 65}` | Live sensor reading |
| `sensors/{sensor_code}/heartbeat` | `{"timestamp": "..."}` | Sensor alive signal |

## Deploy Gratis (Render + Vercel + Neon + HiveMQ)

Arsitektur: frontend di **Vercel**, backend di **Render** (free web service),
database PostgreSQL serverless di **Neon**, broker MQTT cloud di **HiveMQ Cloud**.

File sudah disiapkan: `render.yaml`, `vercel.json`, `.env.production.example`.

1. **Database** — daftar [neon.tech](https://neon.tech) → buat project → salin `DATABASE_URL` (format `postgresql://...?...sslmode=require`).
2. **MQTT** — daftar [hivemq.cloud](https://www.hivemq.com/mqtt-cloud-broker/) → buat cluster gratis → catat broker URL, username, password.
   - Backend otomatis memakai `MQTT_USERNAME`/`MQTT_PASSWORD` (lihat `src/config/index.ts`, `src/index.ts`).
3. **Backend di Render** — buat *New Blueprint* → import repo → isi env (sync:false) sesuai `.env.production.example`:
   `DATABASE_URL`, `MQTT_URL` (mis. `mqtts://broker.hivemq.cloud:8883`), `MQTT_USERNAME`, `MQTT_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN=https://<app>.vercel.app`.
   - Migrasi dijalankan otomatis saat build (`prisma migrate deploy`).
   - **Seed sekali** via Render Shell: `npm run seed`.
   - Set `SIMULATE_SENSOR=true` agar data demo tetap mengalir tanpa ESP32.
   - *Catatan: tier free Render tidur setelah ~15 menit idle; WebSocket otomatis reconnect di frontend.*
4. **Frontend di Vercel** — import repo (preset *Vite* otomatis lewat `vercel.json`), set build env:
   `VITE_API_URL=https://<backend>.onrender.com/api` dan `VITE_WS_URL=wss://<backend>.onrender.com/ws`.
5. Buka URL Vercel → login `admin@example.com` / `admin123`, atau ganti password via register.

## API Overview

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login | - |
| POST | `/api/auth/logout` | Logout | ✓ |
| GET | `/api/auth/me` | Current user | ✓ |
| GET | `/api/sensors` | List sensors | ✓ |
| GET | `/api/sensors/:id` | Sensor detail | ✓ |
| POST | `/api/sensors` | Create sensor | admin |
| PUT | `/api/sensors/:id` | Update sensor | admin |
| DELETE | `/api/sensors/:id` | Delete sensor | admin |
| POST | `/api/readings` | Ingest reading (ESP32) | service |
| GET | `/api/readings/latest` | Latest reading | ✓ |
| GET | `/api/readings` | History w/ filters | ✓ |
| GET | `/api/alerts` | Active alert list | ✓ |
| PUT | `/api/alerts/:id/resolve` | Resolve alert | admin |
| GET | `/api/settings` | System settings | ✓ |
| PUT | `/api/settings` | Update settings | admin |

## WebSocket Events

Connect to `ws://localhost:8080/ws` with `?token=<JWT>`.

| Event | Payload | When |
|---|---|---|
| `reading` | full reading object | New sensor reading |
| `alert` | alert object | Threshold exceeded |
| `sensor_status` | `{id, status}` | Sensor online/offline |
| `hello` | `{message}` | On connect |