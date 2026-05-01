const { pool } = require("../config/db");
const { invalidateSchemaCache } = require("./schemaHelper");

const hasTable = async (connection, tableName) => {
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS table_count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = ?
    `,
    [tableName]
  );

  return Number(rows[0]?.table_count || 0) > 0;
};

const hasColumn = async (connection, tableName, columnName) => {
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS column_count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
    `,
    [tableName, columnName]
  );

  return Number(rows[0]?.column_count || 0) > 0;
};

const ensureAircraftColumns = async (connection) => {
  const requiredColumns = [
    ["registration_code", "ALTER TABLE aircraft ADD COLUMN registration_code VARCHAR(50) NULL AFTER model"],
    ["range_km", "ALTER TABLE aircraft ADD COLUMN range_km INT NULL AFTER first_class_seats"],
    ["cruising_speed", "ALTER TABLE aircraft ADD COLUMN cruising_speed INT NULL AFTER range_km"],
    ["max_altitude", "ALTER TABLE aircraft ADD COLUMN max_altitude INT NULL AFTER cruising_speed"],
    ["registration_date", "ALTER TABLE aircraft ADD COLUMN registration_date DATE NULL AFTER is_available"],
    [
      "next_maintenance_date",
      "ALTER TABLE aircraft ADD COLUMN next_maintenance_date DATE NULL AFTER registration_date",
    ],
    ["configuration", "ALTER TABLE aircraft ADD COLUMN configuration VARCHAR(100) NULL AFTER next_maintenance_date"],
  ];

  for (const [columnName, sql] of requiredColumns) {
    if (!(await hasColumn(connection, "aircraft", columnName))) {
      await connection.query(sql);
    }
  }
};

const ensureBookingColumns = async (connection) => {
  const requiredColumns = [
    ["booking_ref", "ALTER TABLE booking ADD COLUMN booking_ref VARCHAR(20) NULL AFTER booking_id"],
    ["contact_email", "ALTER TABLE booking ADD COLUMN contact_email VARCHAR(255) NULL AFTER booking_ref"],
    ["contact_mobile", "ALTER TABLE booking ADD COLUMN contact_mobile VARCHAR(30) NULL AFTER contact_email"],
    ["instance_id", "ALTER TABLE booking ADD COLUMN instance_id INT NULL AFTER schedule_id"],
  ];

  for (const [columnName, sql] of requiredColumns) {
    if (!(await hasColumn(connection, "booking", columnName))) {
      await connection.query(sql);
    }
  }

  const [indexRows] = await connection.query(
    `
      SELECT COUNT(*) AS index_count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'booking'
        AND index_name = 'idx_booking_ref'
    `
  );

  if (Number(indexRows[0]?.index_count || 0) === 0) {
    await connection.query("CREATE INDEX idx_booking_ref ON booking (booking_ref)");
  }
};

const ensureFareTable = async (connection) => {
  if (await hasTable(connection, "fare")) {
    return;
  }

  await connection.query(`
    CREATE TABLE fare (
      fare_id INT AUTO_INCREMENT PRIMARY KEY,
      flight_id INT NOT NULL,
      cabin VARCHAR(50) NOT NULL DEFAULT 'ECONOMY',
      base_price DECIMAL(10, 2) NOT NULL,
      taxes DECIMAL(10, 2) NOT NULL DEFAULT 0,
      total_price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fare_flight_id (flight_id),
      CONSTRAINT fk_fare_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE
    )
  `);
};

const ensureFlightInstanceTable = async (connection) => {
  if (await hasTable(connection, "flight_instance")) {
    return;
  }

  await connection.query(`
    CREATE TABLE flight_instance (
      instance_id INT AUTO_INCREMENT PRIMARY KEY,
      schedule_id INT NOT NULL,
      instance_date DATE NOT NULL,
      capacity INT NOT NULL,
      available_seats INT NOT NULL,
      booked_seats INT NOT NULL DEFAULT 0,
      status ENUM('SCHEDULED', 'ACTIVE', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_instance_schedule_date (schedule_id, instance_date),
      INDEX idx_instance_schedule_id (schedule_id),
      CONSTRAINT fk_instance_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id) ON DELETE CASCADE
    )
  `);
};

const ensureOperationalSchema = async () => {
  const connection = await pool.getConnection();

  try {
    await ensureAircraftColumns(connection);
    await ensureBookingColumns(connection);
    await ensureFareTable(connection);
    await ensureFlightInstanceTable(connection);
    invalidateSchemaCache();
  } finally {
    connection.release();
  }
};

module.exports = {
  ensureOperationalSchema,
};
