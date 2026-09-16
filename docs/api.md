# API Documentation

Base URL: `http://localhost:8080/api`

Authentication: `Authorization: Bearer <JWT>`

All endpoints except `POST /api/auth/login` require authentication. Endpoints marked **[ADMIN]** require role `ADMIN`.

---

## POST /auth/login

Login pengguna. **Public**

Body:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Admin", "email": "admin@example.com", "role": "ADMIN" }
}
```

## POST /auth/logout

Logout (stateless, client membuang token). Response: `{ "success": true }`

## GET /auth/me

Mengembalikan user yang sedang login.

## POST /auth/register

Mendaftarkan user baru (role `USER`). Response `201` berisi token + user.

---

## GET /sensors

Daftar semua sensor.

Response:
```json
{ "data": [ { "id": 1, "sensorCode": "ST-001", "name": "Server Room", "location": "Building A", "status": "ONLINE", "isActive": true, "createdAt": "...", "updatedAt": "..." } ] }
```

## GET /sensors/:id

Detail sensor + `readings` (1 data terakhir).

## POST /sensors **[ADMIN]**

Body:
```json
{ "sensorCode": "ST-002", "name": "Warehouse", "location": "Building B" }
```

## PUT /sensors/:id **[ADMIN]**

Update `name`, `location`, `status`, atau `sensorCode`.

## PATCH /sensors/:id/toggle **[ADMIN]**

Aktif/nonaktifkan sensor.

## DELETE /sensors/:id **[ADMIN]**

Hapus sensor beserta data pengukuran (cascade).

---

## POST /readings

Ingest data sensor. **Public** — digunakan oleh ESP32.

Body (HTTP fallback, tanpa sensor_code):
```json
{ "sensor_id": 1, "temperature": 28.5, "humidity": 65 }
```

Body (via sensor code):
```json
{ "sensor_code": "ST-001", "temperature": 28.5, "humidity": 65 }
```

## GET /readings/latest

Query params: `sensor_id` (opsional). Mengembalikan pengukuran terbaru (atau `null`).

## GET /readings

Query params: `sensor_id`, `from` (ISO date), `to` (ISO date), `page`, `limit` (max 200).

Response:
```json
{
  "data": [ { "id": 3, "sensorId": 1, "temperature": 28.5, "humidity": 65, "recordedAt": "...", "sensor": { "sensorCode": "ST-001", "name": "Server Room", "location": "Building A" } } ],
  "meta": { "page": 1, "limit": 50, "total": 120, "totalPages": 3 }
}
```

---

## GET /alerts

Query params: `status` (`ACTIVE` | `RESOLVED` | `ALL`, default `ACTIVE`), `sensor_id`, `severity`, `page`, `limit`.

## GET /alerts/summary

```json
{ "active": 2, "critical": 1, "warning": 1 }
```

## PUT /alerts/:id/resolve **[ADMIN]**

Tandai alert sebagai selesai.

---

## GET /settings

Mengembalikan pengaturan threshold aktif.

## PUT /settings **[ADMIN]**

Body:
```json
{
  "minTemperature": 18,
  "maxTemperature": 30,
  "minHumidity": 40,
  "maxHumidity": 70,
  "refreshInterval": 5
}
```
Validasi: `min < max` untuk temperature dan humidity.

---

## WebSocket — `/ws`

Query param: `token=<JWT>`. Contoh: `ws://localhost:8080/ws?token=<jwt>`

Event yang dikirim server:

| Event | Payload | Kapan |
|---|---|---|
| `hello` | `{ "message": "Connected" }` | Saat koneksi terbentuk |
| `reading` | objek `SensorReading` lengkap | Setiap pengukuran baru |
| `alert` | objek `Alert` | Threshold dilampaui / sensor offline |
| `alert_resolved` | `{ "id", "sensorId", "status" }` | Alert ditandai selesai |
| `sensor_status` | `{ "id", "status": "ONLINE"\|"OFFLINE" }` | Perubahan status sensor |

---

## MQTT Topic (ESP32 → Broker)

| Topic | Payload |
|---|---|
| `sensors/{sensor_code}/data` | `{ "temperature": 28.5, "humidity": 65 }` |
| `sensors/{sensor_code}/heartbeat` | `{ "timestamp": 1234567890 }` |

Backend berlangganan `sensors/+/data` dan `sensors/+/heartbeat`. Sensor dianggap offline jika tidak ada data/heartbeat dalam `SENSOR_OFFLINE_TIMEOUT` (default 30 detik).