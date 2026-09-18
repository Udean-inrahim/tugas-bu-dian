# Cara Restore Backup History Chat (opencode)

Dibuat: 18 September 2026

## Lokasi backup
```
G:\opencode-backup-20260918-1059\
   ├─ share-opencode\    (history chat: opencode.db + auth.json + dll)
   └─ config-opencode\   (konfigurasi opencode)
```

## Kapan dipakai
Dipakai SETELAH laptop di-install ulang / di-wipe, untuk mengembalikan history chat.

## Langkah restore (PowerShell)
Jalankan setelah opencode terpasang di laptop baru:

```powershell
# 1. Pastikan opencode TIDAK sedang berjalan.

# 2. Salin kembali data (buat folder bila belum ada).
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\share\opencode" | Out-Null
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode" | Out-Null

Copy-Item -Recurse -Force "G:\opencode-backup-20260918-1059\share-opencode\*"  "$env:USERPROFILE\.local\share\opencode"
Copy-Item -Recurse -Force "G:\opencode-backup-20260918-1059\config-opencode\*" "$env:USERPROFILE\.config\opencode"

# 3. Buka opencode lagi, history chat akan kembali.
```

Versi manual (tanpa PowerShell env):
```
G:\opencode-backup-20260918-1059\share-opencode   ->  C:\Users\Administrator\.local\share\opencode
G:\opencode-backup-20260918-1059\config-opencode  ->  C:\Users\Administrator\.config\opencode
```

## Catatan penting
- Jika username Windows berubah setelah install ulang, ganti `Administrator` sesuai username baru.
- `auth.json` berisi kredensial login opencode — simpan `G:` dengan aman, jangan dibagikan.
- Website proyek tetap aman tanpa laptop ini (hosting di Vercel + database Neon + kode di GitHub).
- Yang hilang saat wipe hanyalah: (1) history chat ini bila tidak di-backup, dan (2) pengiriman suhu laptop.
