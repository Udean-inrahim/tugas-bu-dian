# Presentasi Proyek — Smart Temperature Monitoring

> Durasi total ±10 menit. Ganti `[nama]` dengan namamu.

---

## Persiapan Sebelum Mulai

- Buka `https://tugas-bu-dian.vercel.app` lalu **Ctrl+F5** (hard refresh).
- Tab 1: login admin (`admin@example.com` / `admin123`).
- Siapkan 1 email cadangan (bukan `vallino200@gmail.com`) untuk demo daftar.
- Pastikan internet stabil.

---

## Alur Presentasi (Urutan Demo)

### 1. Pembukaan (1 menit)
**Katakan:**
> "Selamat pagi/siang, saya [nama]. Saya akan mempresentasikan proyek *Smart Temperature Monitoring*, yaitu sistem pemantau suhu dan kelembapan ruangan secara real-time yang berjalan online 24 jam tanpa perlu server sendiri."

**Lakukan:** Tunjukkan halaman Login.

### 2. Latar Belakang & Tujuan (1 menit)
**Katakan:**
> "Tujuannya memantau suhu dan kelembapan ruangan seperti server room agar tetap aman. Jika melewati batas, sistem otomatis membuat peringatan. Yang membedakan: aplikasi ini *serverless* — tidak butuh laptop menyala terus maupun biaya server."

### 3. Arsitektur & Teknologi (1,5 menit)
**Katakan:**
> "Frontend React di Vercel, backend API juga di Vercel, dan database PostgreSQL di Neon. Data sensor masuk lewat endpoint API secara otomatis. Login diamankan dengan JWT, password di-hash bcrypt, dan pendaftaran memakai verifikasi email."

**Lakukan (opsional):** Tampilkan diagram:
`Browser → Vercel (Frontend + API) → Neon DB`, dengan `Sensor/Cron → API`.

### 4. Demo Aplikasi (5 menit)

**4a. Login & Dashboard**
- Lakukan: login admin.
- Katakan: "Ini dashboard, ada ringkasan sensor, grafik suhu dan kelembapan 24 jam, serta status online/offline."

**4b. Monitoring & History**
- Lakukan: buka Monitoring, sebut rentang waktu; buka History.
- Katakan: "Monitoring menampilkan grafik yang diperbarui otomatis. History menampilkan seluruh riwayat pembacaan beserta waktu."

**4c. Sensor & Alert**
- Lakukan: buka Sensors → tunjuk `ST-001`; buka Alerts.
- Katakan: "Sensor terdaftar beserta lokasinya. Ketika suhu/kelembapan keluar ambang, sistem otomatis membuat alert warning atau critical."

**4d. Settings (admin)**
- Lakukan: buka Settings, tunjuk ambang suhu/kelembapan dan refresh interval.
- Katakan: "Admin bisa mengatur batas aman suhu dan kelembapan, serta reset password pengguna."

**4e. Daftar + Verifikasi Email (fitur unggulan)**
- Lakukan: logout → Daftar → isi nama + email cadangan + password → **Kirim Kode** → buka inbox → masukkan kode → **Verifikasi & Masuk**.
- Katakan: "Pengguna baru bisa mendaftar dengan email asli. Sistem mengirim kode 6 digit berlaku 15 menit. Selama belum diverifikasi, login ditolak. Perhatikan animasi transisi Login dan Daftar."

**4f. Lupa Password**
- Lakukan: logout → Lupa password? → isi email → **Kirim Kode** → masukkan kode + password baru → login.
- Katakan: "Jika lupa password, pengguna minta kode reset ke emailnya sendiri, tanpa bantuan admin."

### 5. Penutup (1 menit)
**Katakan:**
> "Kesimpulannya, sistem ini memantau suhu dan kelembapan real-time, memberi peringatan otomatis, dan aman karena ada verifikasi email serta enkripsi password. Ke depannya, data demo ini bisa diganti sensor nyata seperti ESP32 melalui API yang sama. Terima kasih."

**Lakukan:** kembali ke Dashboard agar grafik terlihat hidup.

---

## Outline Slide (per slide)

| # | Judul Slide | Isi |
|---|---|---|
| 1 | Judul | Smart Temperature Monitoring — Nama, kelas, tanggal |
| 2 | Latar Belakang | Pentingnya memantau suhu/kelembapan ruangan |
| 3 | Tujuan | Monitoring real-time + peringatan otomatis |
| 4 | Arsitektur | Browser → Vercel (Frontend+API) → Neon; Sensor/Cron → API |
| 5 | Teknologi | React, Vite, TypeScript, Tailwind, Fastify/Hono, Prisma, Neon, JWT, bcrypt |
| 6 | Fitur Utama | Dashboard, Monitoring, History, Sensors, Alerts, Settings |
| 7 | Demo | (langsung praktik) |
| 8 | Keunggulan | Serverless 24/7, gratis, deploy otomatis, aman |
| 9 | Keterbatasan | Data masih simulasi (cron), kuota email Gmail |
| 10 | Pengembangan | Integrasi sensor ESP32, notifikasi WhatsApp/Telegram |
| 11 | Penutup | Kesimpulan + terima kasih |

---

## Antisipasi Pertanyaan

- **Datanya dari mana?** Endpoint `POST /api/readings`; cron GitHub Actions mengisi otomatis.
- **Kalau email tidak masuk?** Cek spam; atau kode tampil di layar (mode demo).
- **Password bisa dilihat?** Tidak, tersimpan sebagai hash bcrypt.
- **Kenapa serverless?** Gratis, tidak perlu server, otomatis deploy dari GitHub.
- **Bisa pakai sensor asli?** Bisa; ESP32 kirim JSON ke endpoint yang sama.
- **Batasan?** Data demo dari simulator; Gmail ±500 email/hari.

---

## Cadangan Kalau Ada Masalah

- **Email tidak masuk** → lanjutkan dengan kode mode demo di layar.
- **Grafik kosong** → refresh; data diisi otomatis oleh cron.
- **Lupa password admin** → login admin, reset dari Settings.
- **Tidak ada internet** → siapkan screenshot tiap halaman sebelumnya.
