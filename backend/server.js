const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { testConnection } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const flightRoutes = require("./routes/flightRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const metaRoutes = require("./routes/metaRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aircraftRoutes = require("./routes/aircraftRoutes");
const fareRoutes = require("./routes/fareRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const instanceRoutes = require("./routes/instanceRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { loadSchema } = require("./utils/schemaHelper");
const { ensureOperationalSchema } = require("./utils/operationalSchema");
const { runSchemaPipeline } = require("./utils/dbPipeline");

dotenv.config();

const app = express();

const explicitOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...explicitOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (allowedOrigins.has(origin) || isLocalhost) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res, next) => {
  try {
    await testConnection();
    const schema = await loadSchema();
    res.json({
      success: true,
      status: "ok",
      database: schema.databaseName,
      procedures: Array.from(schema.procedures),
      data: {
        status: "ok",
        database: schema.databaseName,
        procedures: Array.from(schema.procedures),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/aircraft", aircraftRoutes);
app.use("/api/fares", fareRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/instances", instanceRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  // ── Database injection pipeline: auto-create DB + apply schema.sql ──
  const dbReport = await runSchemaPipeline({ silent: false });
  if (!dbReport.success) {
    console.warn("⚠️  Database pipeline reported issues — check logs above");
  }

  await ensureOperationalSchema();
  await testConnection();

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start backend server:", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
