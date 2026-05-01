const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { getBookingHistory } = require("../utils/bookingData");
const {
  ensureEntity,
  quote,
  parseDurationToMinutes,
  formatDuration,
} = require("../utils/schemaHelper");

const isActiveStatus = (value) => !["cancelled", "inactive"].includes(String(value || "").trim().toLowerCase());

const getAdminDashboard = asyncHandler(async (req, res) => {
  const { entity: flights } = await ensureEntity("flights", ["id", "number"]);
  const { entity: schedules } = await ensureEntity("schedules", ["id", "flightId"]);
  const { entity: airports } = await ensureEntity("airports", ["id", "code", "city", "name"]);
  const { entity: bookings } = await ensureEntity("bookings", ["id", "scheduleId"]);

  const sourceAirportId = flights.columns.sourceAirportId || schedules.columns.sourceAirportId;
  const destinationAirportId = flights.columns.destinationAirportId || schedules.columns.destinationAirportId;
  const sourceOwner = flights.columns.sourceAirportId ? "f" : "s";
  const destinationOwner = flights.columns.destinationAirportId ? "f" : "s";

  if (!sourceAirportId || !destinationAirportId) {
    const error = new Error("Unable to resolve airport relationships for admin dashboard queries.");
    error.statusCode = 500;
    throw error;
  }

  const scheduleGroupBy = [
    `s.${quote(schedules.columns.id)}`,
    `s.${quote(schedules.columns.flightId)}`,
    `f.${quote(flights.columns.number)}`,
    `src.${quote(airports.columns.code)}`,
    `src.${quote(airports.columns.city)}`,
    `src.${quote(airports.columns.name)}`,
    `dst.${quote(airports.columns.code)}`,
    `dst.${quote(airports.columns.city)}`,
    `dst.${quote(airports.columns.name)}`,
  ];

  if (schedules.columns.date) {
    scheduleGroupBy.push(`s.${quote(schedules.columns.date)}`);
  }

  if (schedules.columns.departureTime) {
    scheduleGroupBy.push(`s.${quote(schedules.columns.departureTime)}`);
  }

  if (schedules.columns.arrivalTime) {
    scheduleGroupBy.push(`s.${quote(schedules.columns.arrivalTime)}`);
  }

  if (schedules.columns.price) {
    scheduleGroupBy.push(`s.${quote(schedules.columns.price)}`);
  }

  if (schedules.columns.status) {
    scheduleGroupBy.push(`s.${quote(schedules.columns.status)}`);
  }

  const scheduleOrderBy = [];
  if (schedules.columns.date) {
    scheduleOrderBy.push(`s.${quote(schedules.columns.date)} ASC`);
  }
  if (schedules.columns.departureTime) {
    scheduleOrderBy.push(`s.${quote(schedules.columns.departureTime)} ASC`);
  }
  if (scheduleOrderBy.length === 0) {
    scheduleOrderBy.push(`s.${quote(schedules.columns.id)} ASC`);
  }

  const flightRowsPromise = pool.query(
    `
      SELECT
        f.${quote(flights.columns.id)} AS flight_id,
        f.${quote(flights.columns.number)} AS flight_number,
        src.${quote(airports.columns.code)} AS source_code,
        src.${quote(airports.columns.city)} AS source_city,
        src.${quote(airports.columns.name)} AS source_airport,
        dst.${quote(airports.columns.code)} AS destination_code,
        dst.${quote(airports.columns.city)} AS destination_city,
        dst.${quote(airports.columns.name)} AS destination_airport,
        ${flights.columns.duration ? `f.${quote(flights.columns.duration)}` : "NULL"} AS flight_duration,
        COUNT(DISTINCT s.${quote(schedules.columns.id)}) AS schedules_count,
        ${
          schedules.columns.status
            ? `SUM(CASE WHEN LOWER(COALESCE(s.${quote(schedules.columns.status)}, 'scheduled')) NOT IN ('cancelled', 'inactive') THEN 1 ELSE 0 END)`
            : "COUNT(DISTINCT s.`" + schedules.columns.id + "`)"
        } AS active_schedules,
        ${
          schedules.columns.date && schedules.columns.departureTime
            ? `MIN(CASE WHEN s.${quote(schedules.columns.date)} IS NOT NULL AND s.${quote(schedules.columns.departureTime)} IS NOT NULL THEN CONCAT(DATE(s.${quote(
                schedules.columns.date
              )}), ' ', TIME_FORMAT(s.${quote(schedules.columns.departureTime)}, '%H:%i:%s')) ELSE NULL END)`
            : "NULL"
        } AS next_departure,
        ${schedules.columns.price ? `MIN(s.${quote(schedules.columns.price)})` : "0"} AS starting_price,
        ${
          schedules.columns.departureTime && schedules.columns.arrivalTime
            ? `MIN(TIMESTAMPDIFF(MINUTE, s.${quote(schedules.columns.departureTime)}, s.${quote(
                schedules.columns.arrivalTime
              )}))`
            : "NULL"
        } AS schedule_duration_minutes
      FROM ${quote(flights.table)} f
      LEFT JOIN ${quote(schedules.table)} s
        ON s.${quote(schedules.columns.flightId)} = f.${quote(flights.columns.id)}
      JOIN ${quote(airports.table)} src
        ON src.${quote(airports.columns.id)} = ${sourceOwner}.${quote(sourceAirportId)}
      JOIN ${quote(airports.table)} dst
        ON dst.${quote(airports.columns.id)} = ${destinationOwner}.${quote(destinationAirportId)}
      GROUP BY
        f.${quote(flights.columns.id)},
        f.${quote(flights.columns.number)},
        src.${quote(airports.columns.code)},
        src.${quote(airports.columns.city)},
        src.${quote(airports.columns.name)},
        dst.${quote(airports.columns.code)},
        dst.${quote(airports.columns.city)},
        dst.${quote(airports.columns.name)}
      ORDER BY f.${quote(flights.columns.id)} ASC
    `
  );

  const scheduleRowsPromise = pool.query(
    `
      SELECT
        s.${quote(schedules.columns.id)} AS schedule_id,
        s.${quote(schedules.columns.flightId)} AS flight_id,
        f.${quote(flights.columns.number)} AS flight_number,
        src.${quote(airports.columns.code)} AS source_code,
        src.${quote(airports.columns.city)} AS source_city,
        src.${quote(airports.columns.name)} AS source_airport,
        dst.${quote(airports.columns.code)} AS destination_code,
        dst.${quote(airports.columns.city)} AS destination_city,
        dst.${quote(airports.columns.name)} AS destination_airport,
        ${schedules.columns.date ? `s.${quote(schedules.columns.date)}` : "NULL"} AS departure_date,
        ${
          schedules.columns.departureTime
            ? `TIME_FORMAT(s.${quote(schedules.columns.departureTime)}, '%H:%i')`
            : "NULL"
        } AS departure_time,
        ${
          schedules.columns.arrivalTime
            ? `TIME_FORMAT(s.${quote(schedules.columns.arrivalTime)}, '%H:%i')`
            : "NULL"
        } AS arrival_time,
        ${schedules.columns.price ? `s.${quote(schedules.columns.price)}` : "0"} AS price,
        ${schedules.columns.status ? `s.${quote(schedules.columns.status)}` : "'SCHEDULED'"} AS status,
        COUNT(DISTINCT b.${quote(bookings.columns.id)}) AS booked_count
      FROM ${quote(schedules.table)} s
      JOIN ${quote(flights.table)} f
        ON f.${quote(flights.columns.id)} = s.${quote(schedules.columns.flightId)}
      JOIN ${quote(airports.table)} src
        ON src.${quote(airports.columns.id)} = ${sourceOwner}.${quote(sourceAirportId)}
      JOIN ${quote(airports.table)} dst
        ON dst.${quote(airports.columns.id)} = ${destinationOwner}.${quote(destinationAirportId)}
      LEFT JOIN ${quote(bookings.table)} b
        ON b.${quote(bookings.columns.scheduleId)} = s.${quote(schedules.columns.id)}
      GROUP BY ${scheduleGroupBy.join(", ")}
      ORDER BY ${scheduleOrderBy.join(", ")}
      LIMIT 100
    `
  );

  const airportCountPromise = pool.query(
    `
      SELECT COUNT(*) AS airport_count
      FROM ${quote(airports.table)}
    `
  );

  const [flightRowsResult, scheduleRowsResult, airportCountResult, bookingHistory] = await Promise.all([
    flightRowsPromise,
    scheduleRowsPromise,
    airportCountPromise,
    getBookingHistory(),
  ]);

  const [flightRows] = flightRowsResult;
  const [scheduleRows] = scheduleRowsResult;
  const [[airportCountRow]] = airportCountResult;

  const flightsPayload = flightRows.map((row) => {
    const durationMinutes =
      parseDurationToMinutes(row.flight_duration) || Number(row.schedule_duration_minutes || 0) || 0;

    return {
      flight_id: row.flight_id,
      flight_number: row.flight_number,
      route: `${row.source_code} - ${row.destination_code}`,
      source_code: row.source_code,
      source_city: row.source_city,
      source_airport: row.source_airport,
      destination_code: row.destination_code,
      destination_city: row.destination_city,
      destination_airport: row.destination_airport,
      schedules_count: Number(row.schedules_count || 0),
      active_schedules: Number(row.active_schedules || 0),
      next_departure: row.next_departure || null,
      starting_price: Number(row.starting_price || 0),
      duration_minutes: durationMinutes,
      duration_label: durationMinutes > 0 ? formatDuration(durationMinutes) : "N/A",
    };
  });

  const schedulesPayload = scheduleRows.map((row) => ({
    schedule_id: row.schedule_id,
    flight_id: row.flight_id,
    flight_number: row.flight_number,
    route: `${row.source_code} - ${row.destination_code}`,
    source_code: row.source_code,
    source_city: row.source_city,
    source_airport: row.source_airport,
    destination_code: row.destination_code,
    destination_city: row.destination_city,
    destination_airport: row.destination_airport,
    departure_date: row.departure_date,
    departure_time: row.departure_time,
    arrival_time: row.arrival_time,
    price: Number(row.price || 0),
    status: row.status || "SCHEDULED",
    booked_count: Number(row.booked_count || 0),
  }));

  const totalRevenue = bookingHistory.reduce((sum, booking) => {
    if (String(booking.payment_status || "").toUpperCase() !== "SUCCESS") {
      return sum;
    }

    return sum + Number(booking.amount || 0);
  }, 0);

  const metrics = {
    total_flights: flightsPayload.length,
    total_schedules: schedulesPayload.length,
    active_schedules: schedulesPayload.filter((schedule) => isActiveStatus(schedule.status)).length,
    total_bookings: bookingHistory.length,
    confirmed_bookings: bookingHistory.filter(
      (booking) => String(booking.booking_status || "").toUpperCase() === "CONFIRMED"
    ).length,
    total_revenue: totalRevenue,
    total_airports: Number(airportCountRow?.airport_count || 0),
    total_passengers: bookingHistory.reduce(
      (sum, booking) => sum + Number(booking.passengers?.length || 0),
      0
    ),
  };

  res.json({
    success: true,
    metrics,
    flights: flightsPayload,
    schedules: schedulesPayload,
    bookings: bookingHistory.slice(0, 100),
    data: {
      metrics,
      flights: flightsPayload,
      schedules: schedulesPayload,
      bookings: bookingHistory.slice(0, 100),
    },
  });
});

module.exports = {
  getAdminDashboard,
};
