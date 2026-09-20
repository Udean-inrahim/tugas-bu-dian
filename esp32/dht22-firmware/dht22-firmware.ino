// ============================================================================
// Smart Temperature Monitoring — Firmware ESP32 + DHT22
//
// Membaca suhu & kelembapan dari DHT22, lalu mengirim ke web tugas-bu-dian
// lewat HTTP (cocok untuk backend serverless Vercel yang TIDAK bisa pakai MQTT).
//
// Wiring:
//   ESP32         DHT22
//   3V3    -----  VCC (+)
//   GND    -----  GND (-)
//   GPIO4  -----  DATA (S)  + resistor pull-up 10k ke 3V3 (biasanya sudah
//                          ada di board sensor yang dijual, tak perlu tambah)
//
// Library yang dibutuhkan (Arduino IDE -> Library Manager):
//   - DHT sensor library          (Adafruit)
//   - Adafruit Unified Sensor
//
// Sebelum upload:
//   1. Ubah SSID_WIFI dan PASSWORD_WIFI dengan Wi-Fi kamu.
//   2. Ubah SENSOR_CODE dan daftarkan kode yang sama di dashboard
//      (menu Sensor) — kalau kode belum terdaftar, backend balas 404.
//   3. Isi API_KEY dengan kunci rahasia sensor. Ambil dari dashboard saat
//      sensor dibuat (tombol "Salin API Key"), atau buat lewat tombol kunci
//      di daftar sensor. Sensor yang sudah punya key MENOLAK data tanpa key
//      yang benar (HTTP 401).
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ------------------ KONFIGURASI ------------------
const char* SSID_WIFI = "NAMA_WIFI_ANDA";
const char* PASSWORD_WIFI = "PASSWORD_WIFI_ANDA";
const char* API_URL = "https://tugas-bu-dian.vercel.app/api/readings";
const char* SENSOR_CODE = "ESP32-01";   // WAJIB sama dengan kode di dashboard
const char* API_KEY = "ISI_API_KEY_DARI_DASHBOARD"; // salin dari menu Sensor -> tombol kunci
const int DHT_PIN = 4;                  // GPIO yang terhubung ke DATA DHT22
const int INTERVAL_DETIK = 30;          // < 120 detik agar status tetap ONLINE
// --------------------------------------------------

#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

void konekWifi() {
  Serial.print("Menghubungkan ke Wi-Fi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID_WIFI, PASSWORD_WIFI);
  unsigned long mulai = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - mulai < 20000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nTerhubung! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nGAGAL konek Wi-Fi — cek SSID/password.");
  }
}

void kirimKeServer(float suhu, float lembab) {
  if (WiFi.status() != WL_CONNECTED) {
    konekWifi();
    return;
  }
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<160> doc;
  doc["sensor_code"] = SENSOR_CODE;
  doc["temperature"] = suhu;
  doc["humidity"] = lembab;
  doc["api_key"] = API_KEY;
  String body;
  serializeJson(doc, body);

  int kode = http.POST(body);
  String respon = http.getString();
  http.end();

  if (kode == 201) {
    Serial.printf("TERKIRIM  %5.1f C  %5.1f%%  (HTTP %d)\n", suhu, lembab, kode);
  } else {
    Serial.printf("GAGAL     HTTP %d  -> %s\n", kode, respon.c_str());
    if (kode == 404) {
      Serial.println("Sensor code tidak dikenal! Daftarkan '"
                     + String(SENSOR_CODE) + "' dulu di dashboard.");
    } else if (kode == 401) {
      Serial.println("API key salah! Salin ulang kunci dari dashboard (menu Sensor).");
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  dht.begin();
  konekWifi();
}

void loop() {
  float suhu = dht.readTemperature();
  float lembab = dht.readHumidity();

  if (isnan(suhu) || isnan(lembab)) {
    Serial.println("Gagal baca DHT22 — cek wiring/resistor dan pastikan kabel DATA ke GPIO "
                   + String(DHT_PIN));
  } else {
    Serial.printf("Bacaan:  %5.1f C  %5.1f%%\n", suhu, lembab);
    kirimKeServer(suhu, lembab);
  }

  delay(INTERVAL_DETIK * 1000);
}