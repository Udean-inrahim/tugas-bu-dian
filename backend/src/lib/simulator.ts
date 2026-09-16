type SimulatorOptions = {
  sensorCode: string;
  intervalMs: number;
  tempBase: number;
  humidityBase: number;
};

export function startSimulator(
  publish: (topic: string, payload: string) => void,
  { sensorCode, intervalMs, tempBase, humidityBase }: SimulatorOptions
) {
  console.log(
    `🤖 Simulator aktif: ${sensorCode} — tiap ${intervalMs}ms (suhu ~${tempBase}°C, lembap ~${humidityBase}%)`
  );

  const drift = () => (Math.random() - 0.5) * 2;

  setInterval(() => {
    const temperature = Math.round((tempBase + drift()) * 10) / 10;
    const humidity = Math.round((humidityBase + drift() * 4) * 10) / 10;

    publish(
      `sensors/${sensorCode}/data`,
      JSON.stringify({ temperature, humidity })
    );
  }, intervalMs);

  setInterval(() => {
    publish(
      `sensors/${sensorCode}/heartbeat`,
      JSON.stringify({ timestamp: Date.now() })
    );
  }, intervalMs);
}