# ============================================================================
# laptop-sensor.ps1 — Kirim suhu GPU/VGA laptop ke Smart Temperature Monitoring.
#
# Pengganti sementara sensor ESP32: skrip ini membaca suhu GPU NVIDIA (VGA)
# lalu mengirimnya ke endpoint yang sama dengan yang nanti dipakai ESP32.
#
# Cara pakai (PowerShell):
#   .\laptop-sensor.ps1
#   .\laptop-sensor.ps1 -IntervalSeconds 30 -SensorCode LAPTOP-01
#
# Berhenti: tekan Ctrl+C.
# ============================================================================

param(
  [string]$ApiUrl = "https://tugas-bu-dian.vercel.app",
  [string]$SensorCode = "LAPTOP-01",
  [string]$ApiKey = "",  # ambil dari dashboard (menu Sensor -> tombol kunci). "" = kirim tanpa key.
  [int]$IntervalSeconds = 30
)

function Get-LaptopTemperature {
  # Suhu GPU NVIDIA (VGA). Membutuhkan driver NVIDIA (nvidia-smi).
  if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    $gpu = (& nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader 2>$null | Select-Object -First 1)
    if ($gpu -and $gpu -match '^\d+') { return [double]$gpu }
  }
  return $null
}

Write-Host "Mengirim suhu laptop ke $ApiUrl (sensor $SensorCode) tiap $IntervalSeconds detik."
Write-Host "Tekan Ctrl+C untuk berhenti."
Write-Host ""

while ($true) {
  $temp = Get-LaptopTemperature
  if ($null -ne $temp) {
    # Laptop tidak punya sensor kelembapan -> kirim nilai perkiraan yang berubah halus.
    $humidity = [math]::Round(45 + 3 * [math]::Sin((Get-Date).TimeOfDay.TotalMinutes / 20), 1)
    $body = @{
      sensor_code = $SensorCode
      temperature = $temp
      humidity    = $humidity
    }
    if ($ApiKey) { $body.api_key = $ApiKey }
    $json = $body | ConvertTo-Json -Compress
    try {
      Invoke-RestMethod -Uri "$ApiUrl/api/readings" -Method POST `
        -ContentType "application/json" -Body $json -TimeoutSec 20 | Out-Null
      Write-Host ("{0}  {1,5:N1} C  kelembapan {2:N1}%  -> terkirim" -f (Get-Date -Format "HH:mm:ss"), $temp, $humidity)
    } catch {
      Write-Host ("{0}  GAGAL kirim: {1}" -f (Get-Date -Format "HH:mm:ss"), $_.Exception.Message)
    }
  } else {
    Write-Host ("{0}  Suhu GPU tidak terbaca (driver NVIDIA tidak tersedia)." -f (Get-Date -Format "HH:mm:ss"))
  }
  Start-Sleep -Seconds $IntervalSeconds
}
