import type { MqttClient } from "mqtt";

type SimulatorOptions = {
  sensorCode: string;
  intervalMs: number;
  tempBase: number;
  humidityBase: number;
};

export function startSimulator(
  mqttClient: MqttClient,
  { sensorCode, intervalMs, tempBase, humidityBase }: SimulatorOptions
) {
  console.log(
    `🤖 Simulator aktif: ${sensorCode} — tiap ${intervalMs}ms (suhu ~${tempBase}°C, lembap ~${humidityBase}%)`
  );

  const drift = () => (Math.random() - 0.5) * 2;

  setInterval(() => {
    if (!mqttClient.connected) return;
    const temperature = Math.round((tempBase + drift()) * 10) / 10;
    const humidity = Math.round((humidityBase + drift() * 4) * 10) / 10;

    mqttClient.publish(
      `sensors/${sensorCode}/data`,
      JSON.stringify({ temperature, humidity }),
      { qos: 1 }
    );
  }, intervalMs);

  // Heartbeat every interval
  setInterval(() => {
    if (!mqttClient.connected) return;
    mqttClient.publish(
      `sensors/${sensorCode}/heartbeat`,
      JSON.stringify({ timestamp: Date.now() }),
      { qos: 0 }
    );
  }, intervalMs);
}