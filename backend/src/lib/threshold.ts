export type Condition = {
  status: "NORMAL" | "WARNING" | "CRITICAL";
  label: string;
  color: "green" | "yellow" | "red" | "blue";
};

export type Thresholds = {
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
};

export function classifyTemperature(value: number, t: Thresholds): Condition {
  if (value < t.minTemperature) {
    return { status: "WARNING", label: "Dingin", color: "blue" };
  }
  if (value > t.maxTemperature) {
    return { status: "CRITICAL", label: "Panas", color: "red" };
  }
  return { status: "NORMAL", label: "Normal", color: "green" };
}

export function classifyHumidity(value: number, t: Thresholds): Condition {
  if (value < t.minHumidity) {
    return { status: "WARNING", label: "Kering", color: "yellow" };
  }
  if (value > t.maxHumidity) {
    return { status: "CRITICAL", label: "Lembap", color: "red" };
  }
  return { status: "NORMAL", label: "Normal", color: "green" };
}

export function buildThresholdViolations(
  sensorId: number,
  temperature: number,
  humidity: number,
  t: Thresholds
) {
  const violations: {
    type: "HIGH_TEMP" | "LOW_TEMP" | "HIGH_HUMIDITY" | "LOW_HUMIDITY";
    value: number;
    threshold: number;
    message: string;
    severity: "WARNING" | "CRITICAL";
  }[] = [];

  if (temperature > t.maxTemperature) {
    violations.push({
      type: "HIGH_TEMP",
      value: temperature,
      threshold: t.maxTemperature,
      message: `Temperature mencapai ${temperature.toFixed(1)}°C, batas maksimum ${t.maxTemperature}°C`,
      severity: "CRITICAL",
    });
  }
  if (temperature < t.minTemperature) {
    violations.push({
      type: "LOW_TEMP",
      value: temperature,
      threshold: t.minTemperature,
      message: `Temperature turun ke ${temperature.toFixed(1)}°C, batas minimum ${t.minTemperature}°C`,
      severity: "WARNING",
    });
  }
  if (humidity > t.maxHumidity) {
    violations.push({
      type: "HIGH_HUMIDITY",
      value: humidity,
      threshold: t.maxHumidity,
      message: `Humidity mencapai ${humidity.toFixed(1)}%, batas maksimum ${t.maxHumidity}%`,
      severity: "CRITICAL",
    });
  }
  if (humidity < t.minHumidity) {
    violations.push({
      type: "LOW_HUMIDITY",
      value: humidity,
      threshold: t.minHumidity,
      message: `Humidity turun ke ${humidity.toFixed(1)}%, batas minimum ${t.minHumidity}%`,
      severity: "WARNING",
    });
  }

  return violations;
}