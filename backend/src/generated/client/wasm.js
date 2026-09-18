
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  emailVerified: 'emailVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SensorScalarFieldEnum = {
  id: 'id',
  sensorCode: 'sensorCode',
  name: 'name',
  location: 'location',
  status: 'status',
  isActive: 'isActive',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SensorReadingScalarFieldEnum = {
  id: 'id',
  sensorId: 'sensorId',
  temperature: 'temperature',
  humidity: 'humidity',
  recordedAt: 'recordedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  sensorId: 'sensorId',
  type: 'type',
  value: 'value',
  threshold: 'threshold',
  message: 'message',
  severity: 'severity',
  status: 'status',
  createdAt: 'createdAt',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.SettingScalarFieldEnum = {
  id: 'id',
  minTemperature: 'minTemperature',
  maxTemperature: 'maxTemperature',
  minHumidity: 'minHumidity',
  maxHumidity: 'maxHumidity',
  refreshInterval: 'refreshInterval',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.SensorStatus = exports.$Enums.SensorStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE'
};

exports.AlertType = exports.$Enums.AlertType = {
  HIGH_TEMP: 'HIGH_TEMP',
  LOW_TEMP: 'LOW_TEMP',
  HIGH_HUMIDITY: 'HIGH_HUMIDITY',
  LOW_HUMIDITY: 'LOW_HUMIDITY',
  SENSOR_OFFLINE: 'SENSOR_OFFLINE'
};

exports.Severity = exports.$Enums.Severity = {
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

exports.AlertStatus = exports.$Enums.AlertStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Sensor: 'Sensor',
  SensorReading: 'SensorReading',
  Alert: 'Alert',
  Setting: 'Setting'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\Administrator\\Documents\\Default Project\\backend\\src\\generated\\client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "C:\\Users\\Administrator\\Documents\\Default Project\\backend\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// Smart Temperature Monitoring - Prisma Schema\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  previewFeatures = [\"driverAdapters\"]\n  output          = \"../src/generated/client\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n// ============ Users ============\nmodel User {\n  id            Int      @id @default(autoincrement())\n  name          String\n  email         String   @unique\n  password      String\n  role          Role     @default(USER)\n  emailVerified Boolean  @default(false) @map(\"email_verified\")\n  createdAt     DateTime @default(now()) @map(\"created_at\")\n  updatedAt     DateTime @updatedAt @map(\"updated_at\")\n\n  sensors Sensor[]\n\n  @@map(\"users\")\n}\n\nenum Role {\n  ADMIN\n  USER\n}\n\n// ============ Sensors ============\nmodel Sensor {\n  id         Int          @id @default(autoincrement())\n  sensorCode String       @unique @map(\"sensor_code\")\n  name       String\n  location   String\n  status     SensorStatus @default(OFFLINE)\n  isActive   Boolean      @default(true) @map(\"is_active\")\n  userId     Int          @map(\"user_id\")\n  createdAt  DateTime     @default(now()) @map(\"created_at\")\n  updatedAt  DateTime     @updatedAt @map(\"updated_at\")\n\n  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  readings SensorReading[]\n  alerts   Alert[]\n\n  @@index([userId])\n  @@map(\"sensors\")\n}\n\nenum SensorStatus {\n  ONLINE\n  OFFLINE\n}\n\n// ============ Sensor Readings ============\nmodel SensorReading {\n  id          Int      @id @default(autoincrement())\n  sensorId    Int      @map(\"sensor_id\")\n  temperature Float\n  humidity    Float\n  recordedAt  DateTime @default(now()) @map(\"recorded_at\")\n\n  sensor Sensor @relation(fields: [sensorId], references: [id], onDelete: Cascade)\n\n  @@index([sensorId, recordedAt])\n  @@map(\"sensor_readings\")\n}\n\n// ============ Alerts ============\nmodel Alert {\n  id         Int         @id @default(autoincrement())\n  sensorId   Int         @map(\"sensor_id\")\n  type       AlertType\n  value      Float\n  threshold  Float\n  message    String\n  severity   Severity\n  status     AlertStatus @default(ACTIVE) @map(\"status\")\n  createdAt  DateTime    @default(now()) @map(\"created_at\")\n  resolvedAt DateTime?   @map(\"resolved_at\")\n\n  sensor Sensor @relation(fields: [sensorId], references: [id], onDelete: Cascade)\n\n  @@index([status, createdAt])\n  @@map(\"alerts\")\n}\n\nenum AlertType {\n  HIGH_TEMP\n  LOW_TEMP\n  HIGH_HUMIDITY\n  LOW_HUMIDITY\n  SENSOR_OFFLINE\n}\n\nenum Severity {\n  WARNING\n  CRITICAL\n}\n\nenum AlertStatus {\n  ACTIVE\n  RESOLVED\n}\n\n// ============ Settings ============\nmodel Setting {\n  id              Int      @id @default(1)\n  minTemperature  Float    @default(18) @map(\"min_temperature\")\n  maxTemperature  Float    @default(30) @map(\"max_temperature\")\n  minHumidity     Float    @default(40) @map(\"min_humidity\")\n  maxHumidity     Float    @default(70) @map(\"max_humidity\")\n  refreshInterval Int      @default(5) @map(\"refresh_interval\")\n  updatedAt       DateTime @updatedAt @map(\"updated_at\")\n\n  @@map(\"settings\")\n}\n",
  "inlineSchemaHash": "dc1d92016df6370729a2178345d4ad2b691e64b61353b3ad5b41b214ba8e8adb",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"Role\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"Boolean\",\"dbName\":\"email_verified\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"sensors\",\"kind\":\"object\",\"type\":\"Sensor\",\"relationName\":\"SensorToUser\"}],\"dbName\":\"users\"},\"Sensor\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sensorCode\",\"kind\":\"scalar\",\"type\":\"String\",\"dbName\":\"sensor_code\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"SensorStatus\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\",\"dbName\":\"is_active\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"Int\",\"dbName\":\"user_id\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SensorToUser\"},{\"name\":\"readings\",\"kind\":\"object\",\"type\":\"SensorReading\",\"relationName\":\"SensorToSensorReading\"},{\"name\":\"alerts\",\"kind\":\"object\",\"type\":\"Alert\",\"relationName\":\"AlertToSensor\"}],\"dbName\":\"sensors\"},\"SensorReading\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sensorId\",\"kind\":\"scalar\",\"type\":\"Int\",\"dbName\":\"sensor_id\"},{\"name\":\"temperature\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"humidity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"recordedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"recorded_at\"},{\"name\":\"sensor\",\"kind\":\"object\",\"type\":\"Sensor\",\"relationName\":\"SensorToSensorReading\"}],\"dbName\":\"sensor_readings\"},\"Alert\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"sensorId\",\"kind\":\"scalar\",\"type\":\"Int\",\"dbName\":\"sensor_id\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"AlertType\"},{\"name\":\"value\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"threshold\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"severity\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"AlertStatus\",\"dbName\":\"status\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"created_at\"},{\"name\":\"resolvedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"resolved_at\"},{\"name\":\"sensor\",\"kind\":\"object\",\"type\":\"Sensor\",\"relationName\":\"AlertToSensor\"}],\"dbName\":\"alerts\"},\"Setting\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"minTemperature\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"min_temperature\"},{\"name\":\"maxTemperature\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"max_temperature\"},{\"name\":\"minHumidity\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"min_humidity\"},{\"name\":\"maxHumidity\",\"kind\":\"scalar\",\"type\":\"Float\",\"dbName\":\"max_humidity\"},{\"name\":\"refreshInterval\",\"kind\":\"scalar\",\"type\":\"Int\",\"dbName\":\"refresh_interval\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\",\"dbName\":\"updated_at\"}],\"dbName\":\"settings\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

