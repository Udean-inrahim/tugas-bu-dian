# ============================================================================
# laptop-sensor.ps1 — Kirim suhu laptop ke Smart Temperature Monitoring.
#
# Pengganti sementara sensor ESP32: skrip ini membaca suhu perangkat (GPU/CPU)
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
  [int]$IntervalSeconds = 30
)

function Get-LaptopTemperature {
  # 1) GPU NVIDIA (paling bersih bila ada).
  if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    $gpu = (& nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader 2>$null | Select-Object -First 1)
    if ($gpu -and $gpu -match '^\d+') { return [double]$gpu }
  }
  # 2) ACPI thermal zone (CPU/mainboard).
  try {
    $zone = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop |
      Select-Object -First 1
    if ($zone) { return [math]::Round($zone.CurrentTemperature / 10 - 273.15, 1) }
  } catch { }
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
    } | ConvertTo-Json -Compress
    try {
      Invoke-RestMethod -Uri "$ApiUrl/api/readings" -Method POST `
        -ContentType "application/json" -Body $body -TimeoutSec 20 | Out-Null
      Write-Host ("{0}  {1,5:N1} C  kelembapan {2:N1}%  -> terkirim" -f (Get-Date -Format "HH:mm:ss"), $temp, $humidity)
    } catch {
      Write-Host ("{0}  GAGAL kirim: {1}" -f (Get-Date -Format "HH:mm:ss"), $_.Exception.Message)
    }
  } else {
    Write-Host ("{0}  Suhu tidak terbaca di perangkat ini." -f (Get-Date -Format "HH:mm:ss"))
  }
  Start-Sleep -Seconds $IntervalSeconds
}
