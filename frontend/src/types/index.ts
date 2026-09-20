export type Role = "ADMIN" | "USER";

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  role: Role;
  createdAt?: string;
}

export type SensorStatusType = "ONLINE" | "OFFLINE";

export interface Sensor {
  id: number;
  sensorCode: string;
  name: string;
  location: string;
  status: SensorStatusType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastReading?: SensorReading | null;
}

export type AlertType =
  | "HIGH_TEMP"
  | "LOW_TEMP"
  | "HIGH_HUMIDITY"
  | "LOW_HUMIDITY"
  | "SENSOR_OFFLINE";

export type Severity = "WARNING" | "CRITICAL";

export type AlertStatusType = "ACTIVE" | "RESOLVED";

export interface SensorReading {
  id: number;
  sensorId: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
  sensor?: {
    id: number;
    sensorCode: string;
    name: string;
    location: string;
  };
}

export interface Alert {
  id: number;
  sensorId: number;
  type: AlertType;
  value: number;
  threshold: number;
  message: string;
  severity: Severity;
  status: AlertStatusType;
  createdAt: string;
  resolvedAt: string | null;
  sensor?: {
    id: number;
    sensorCode: string;
    name: string;
    location: string;
  };
}

export interface Settings {
  id: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  refreshInterval: number;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AlertSummary {
  active: number;
  critical: number;
  warning: number;
}

export type Condition = {
  status: "NORMAL" | "WARNING" | "CRITICAL";
  label: string;
  color: "green" | "yellow" | "red" | "blue";
};

export interface DashboardReading extends SensorReading {
  tempCondition: Condition;
  humidityCondition: Condition;
}

export type ChartRange = "1h" | "6h" | "12h" | "24h" | "7d";

export const CHART_RANGES: { value: ChartRange; label: string }[] = [
  { value: "1h", label: "1 Jam" },
  { value: "6h", label: "6 Jam" },
  { value: "12h", label: "12 Jam" },
  { value: "24h", label: "24 Jam" },
  { value: "7d", label: "7 Hari" },
];