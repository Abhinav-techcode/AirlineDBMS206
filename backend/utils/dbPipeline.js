/**
 * Database Injection Pipeline
 * ───────────────────────────
 * Reads schema.sql and executes it statement-by-statement against the MySQL
 * connection defined in .env. Designed to run:
 *   1. On-demand via `npm run db:init`
 *   2. Automatically on backend startup (imported by server.js)
 *
 * Features:
 *   - Creates the database if it doesn't exist
 *   - Splits multi-statement SQL respecting DELIMITER changes
 *   - Idempotent — safe to run every time the server starts
 *   - Logs each step with ✅ / ❌ status
 *   - Returns a summary report for programmatic use
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SCHEMA_PATH = path.resolve(__dirname, "../../database/schema.sql");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
  dateStrings: true,
  decimalNumbers: true,
};

const DB_NAME = process.env.DB_NAME || "Airline_mangemnt_System";

/**
 * Split raw SQL into executable statements, handling DELIMITER changes.
 */
const splitStatements = (rawSql) => {
  const lines = rawSql.replace(/\r\n/g, "\n").split("\n");
  const statements = [];
  let currentDelimiter = ";";
  let buffer = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle DELIMITER directive
    const delimMatch = trimmed.match(/^DELIMITER\s+(.+)$/i);
    if (delimMatch) {
      // Flush any pending buffer
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = "";
      }
      currentDelimiter = delimMatch[1].trim();
      continue;
    }

    // Skip pure comments and empty lines inside buffer
    if (!buffer && (trimmed === "" || trimmed.startsWith("--"))) {
      continue;
    }

    buffer += line + "\n";

    // Check if the buffer ends with the current delimiter
    const trimmedBuffer = buffer.trimEnd();
    if (trimmedBuffer.endsWith(currentDelimiter)) {
      // Remove trailing delimiter and push
      const stmt = trimmedBuffer.slice(0, -currentDelimiter.length).trim();
      if (stmt) {
        statements.push(stmt);
      }
      buffer = "";
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    statements.push(buffer.trim());
  }

  return statements;
};

/**
 * Run the full schema injection pipeline.
 * Returns { success, created, failed, skipped, errors, duration }
 */
const runSchemaPipeline = async ({ silent = false } = {}) => {
  const log = silent ? () => {} : console.log;
  const startTime = Date.now();
  const report = { success: true, created: 0, failed: 0, skipped: 0, errors: [] };

  // ── Step 1: Verify schema file exists ──
  if (!fs.existsSync(SCHEMA_PATH)) {
    const msg = `Schema file not found at ${SCHEMA_PATH}`;
    log(`❌ ${msg}`);
    report.success = false;
    report.errors.push(msg);
    return report;
  }

  log("╔══════════════════════════════════════════════╗");
  log("║   DATABASE INJECTION PIPELINE                ║");
  log("╚══════════════════════════════════════════════╝");
  log(`📄 Schema: ${SCHEMA_PATH}`);
  log(`🗄️  Target: ${DB_CONFIG.host}:${DB_CONFIG.port} → ${DB_NAME}`);
  log("");

  let connection;

  try {
    // ── Step 2: Connect without database (to create it if needed) ──
    log("⏳ Connecting to MySQL server...");
    connection = await mysql.createConnection(DB_CONFIG);
    log("✅ Connected to MySQL server");

    // ── Step 3: Create database if not exists ──
    log(`⏳ Ensuring database '${DB_NAME}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);
    log(`✅ Database '${DB_NAME}' ready`);

    // ── Step 4: Enable event scheduler ──
    try {
      await connection.query("SET GLOBAL event_scheduler = ON");
      log("✅ Event scheduler enabled");
    } catch (err) {
      log("⚠️  Could not enable event scheduler (may need SUPER privilege)");
      report.skipped++;
    }

    // ── Step 5: Read and split schema ──
    log("⏳ Reading schema file...");
    const rawSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
    const statements = splitStatements(rawSql);
    log(`✅ Parsed ${statements.length} SQL statements`);
    log("");

    // ── Step 6: Execute statements one by one ──
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.replace(/\s+/g, " ").slice(0, 80);

      try {
        await connection.query(stmt);
        report.created++;
        log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (err) {
        // Tolerate "already exists" and similar non-destructive errors
        const toleratedCodes = [
          "ER_TABLE_EXISTS_ERROR",
          "ER_DUP_KEYNAME",
          "ER_DUP_ENTRY",
          "ER_SP_ALREADY_EXISTS",
          "ER_EVENT_ALREADY_EXISTS",
          "ER_TRG_ALREADY_EXISTS",
        ];

        if (toleratedCodes.includes(err.code)) {
          report.skipped++;
          log(`  ⏭️  [${i + 1}/${statements.length}] Already exists — skipped`);
        } else {
          report.failed++;
          report.errors.push({ statement: i + 1, preview, code: err.code, message: err.message });
          log(`  ❌ [${i + 1}/${statements.length}] ${err.code}: ${err.message.slice(0, 120)}`);
        }
      }
    }

    // ── Step 7: Verify critical tables exist ──
    log("");
    log("⏳ Running verification checks...");
    const criticalTables = [
      "Airline", "Airport", "Aircraft", "Seat", "Users",
      "Flight", "Schedule", "Schedule_Seat", "Booking",
      "Passenger", "Ticket", "Payment", "Seat_Lock", "Error_Log",
    ];

    const [tableRows] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
      [DB_NAME]
    );
    const existingTables = new Set(tableRows.map((r) => r.TABLE_NAME || r.table_name));

    for (const table of criticalTables) {
      const found = existingTables.has(table) || existingTables.has(table.toLowerCase());
      log(`  ${found ? "✅" : "❌"} Table: ${table}`);
      if (!found) {
        report.errors.push(`Critical table missing: ${table}`);
        report.success = false;
      }
    }

    // Verify triggers
    const [triggerRows] = await connection.query(
      `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = ?`,
      [DB_NAME]
    );
    const triggers = new Set(triggerRows.map((r) => r.TRIGGER_NAME || r.trigger_name));
    const requiredTriggers = [
      "auto_create_schedule_seats",
      "prevent_overbooking",
      "after_ticket_insert",
      "sync_payment_status_insert",
      "sync_payment_status_update",
    ];

    for (const trigger of requiredTriggers) {
      const found = triggers.has(trigger);
      log(`  ${found ? "✅" : "❌"} Trigger: ${trigger}`);
      if (!found) {
        report.errors.push(`Required trigger missing: ${trigger}`);
        report.success = false;
      }
    }

    // Verify procedures
    const [procRows] = await connection.query(
      `SELECT routine_name FROM information_schema.routines WHERE routine_schema = ? AND routine_type = 'PROCEDURE'`,
      [DB_NAME]
    );
    const procedures = new Set(procRows.map((r) => r.ROUTINE_NAME || r.routine_name));
    const requiredProcs = ["SafeBooking", "GetAllAircraftModels", "GetFlightRevenue", "SeatSummary"];

    for (const proc of requiredProcs) {
      const found = procedures.has(proc);
      log(`  ${found ? "✅" : "❌"} Procedure: ${proc}`);
      if (!found) {
        report.errors.push(`Required procedure missing: ${proc}`);
        report.success = false;
      }
    }

    // Verify seed data
    const [[seatCount]] = await connection.query(`SELECT COUNT(*) AS c FROM Seat`);
    const [[scheduleSeatCount]] = await connection.query(`SELECT COUNT(*) AS c FROM Schedule_Seat`);
    log(`  ✅ Seats: ${seatCount.c} rows`);
    log(`  ${scheduleSeatCount.c > 0 ? "✅" : "❌"} Schedule_Seat: ${scheduleSeatCount.c} rows (trigger-populated)`);

    if (Number(scheduleSeatCount.c) === 0) {
      report.errors.push("Schedule_Seat is empty — auto_create_schedule_seats trigger may have failed");
      report.success = false;
    }

  } catch (err) {
    report.success = false;
    report.errors.push({ message: err.message, code: err.code });
    log(`❌ Pipeline failed: ${err.message}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  report.duration = Date.now() - startTime;

  log("");
  log("═══════════════════════════════════════════════");
  log(`  Pipeline ${report.success ? "✅ PASSED" : "❌ FAILED"}`);
  log(`  Created: ${report.created}  Skipped: ${report.skipped}  Failed: ${report.failed}`);
  log(`  Duration: ${report.duration}ms`);
  if (report.errors.length > 0) {
    log(`  Errors: ${report.errors.length}`);
  }
  log("═══════════════════════════════════════════════");

  return report;
};

// CLI entry point: `node utils/dbPipeline.js`
if (require.main === module) {
  runSchemaPipeline()
    .then((report) => {
      process.exit(report.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal pipeline error:", err);
      process.exit(1);
    });
}

module.exports = { runSchemaPipeline };
