// Generator data demo yang menyerupai sensor sungguhan.
//
// Data dibentuk dari tren harian (malam lebih dingin, siang lebih hangat)
// ditambah noise halus multi-skala (value noise / fbm) yang deterministik,
// sehingga grafik terlihat organik: tidak lurus, tidak bergerigi, dan antar
// titik berurutan tetap saling berdekatan.
//
// Dipakai bersama oleh seed (data historis) dan serverless heartbeat (data baru)
// agar pola lama dan baru menyambung.

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Value noise kontinu pada rentang [0, 1].
function valueNoise(x: number): number {
  const i = Math.floor(x);
  const f = smoothstep(x - i);
  return hash(i) * (1 - f) + hash(i + 1) * f;
}

// Fractal noise pada rentang [-1, 1].
function fbm(x: number, octaves = 3): number {
  let sum = 0;
  let amp = 1;
  let total = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * (valueNoise(x * freq) * 2 - 1);
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}

export function demoReading(atMs: number): { temperature: number; humidity: number } {
  const minutes = atMs / 60_000;
  const dayMs = 86_400_000;
  const dayFraction = (((atMs % dayMs) + dayMs) % dayMs) / dayMs;
  // -1 saat dini hari, +1 saat sore.
  const diurnal = Math.sin(dayFraction * Math.PI * 2 - Math.PI / 2);

  // Ruang server: dasar sejuk, menghangat saat siang.
  const baseTemp = 23.5 + 2.2 * diurnal;
  const tempNoise =
    0.6 * fbm(minutes / 90, 3) + // drift lambat (beberapa jam)
    0.25 * fbm(minutes / 9, 2) + // fluktuasi sedang (belasan menit)
    0.12 * fbm(minutes / 1.7, 1); // jitter sensor cepat
  const temperature = baseTemp + tempNoise;

  // Kelembapan cenderung berlawanan dengan suhu.
  const baseHumidity = 52 - 3.5 * diurnal;
  const humNoise = 4 * fbm(minutes / 75 + 100, 3) + 1.5 * fbm(minutes / 7 + 50, 2);
  const humidity = Math.min(80, Math.max(30, baseHumidity + humNoise));

  return {
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(1)),
  };
}
