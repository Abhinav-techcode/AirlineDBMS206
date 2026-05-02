const asyncHandler = require("../utils/asyncHandler");
const { createFlight, listFlights } = require("../models/flightModel");
const { pool } = require("../config/db");

// No hardcoded images — airline branding should come from DB or asset storage

const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes || 0);
  if (totalMinutes <= 0) {
    return "N/A";
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
};

exports.createFlight = asyncHandler(async (req, res) => {
  const { flight_number, aircraft_id, source_airport_id, destination_airport_id } = req.body;

  if (!flight_number || !aircraft_id || !source_airport_id || !destination_airport_id) {
    return res.status(400).json({
      success: false,
      message: "flight_number, aircraft_id, source_airport_id, and destination_airport_id are required.",
    });
  }

  const flight = await createFlight(req.body);

  res.status(201).json({
    success: true,
    message: "Flight created successfully.",
    data: flight,
  });
});

exports.getFlights = asyncHandler(async (req, res) => {
  const flights = await listFlights();

  res.json({
    success: true,
    count: flights.length,
    data: flights,
  });
});

exports.searchFlights = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Query params "from" and "to" are required.',
    });
  }

  const params = [from, from, to, to];
  const where = [
    "(LOWER(src.city) = LOWER(?) OR LOWER(src.code) = LOWER(?))",
    "(LOWER(dst.city) = LOWER(?) OR LOWER(dst.code) = LOWER(?))",
  ];

  if (date) {
    where.push("DATE(s.date) = DATE(?)");
    params.push(date);
  }

  const [rows] = await pool.query(
    `
      SELECT
        s.schedule_id,
        s.flight_id,
        s.date AS departure_date,
        TIME_FORMAT(s.departure_time, '%H:%i') AS departure_time,
        TIME_FORMAT(s.arrival_time, '%H:%i') AS arrival_time,
        COALESCE(s.price, 0) AS schedule_price,
        f.flight_number,
        f.duration,
        ai.name AS airline_name,
        ai.airline_code,
        ac.model AS aircraft_model,
        src.code AS source_code,
        src.city AS source_city,
        src.name AS source_airport,
        dst.code AS destination_code,
        dst.city AS destination_city,
        dst.name AS destination_airport,
        fi.instance_id,
        COALESCE(
          fi.available_seats,
          SUM(CASE WHEN UPPER(COALESCE(ss.status, 'AVAILABLE')) = 'AVAILABLE' THEN 1 ELSE 0 END)
        ) AS available_seats
      FROM schedule s
      JOIN flight f ON f.flight_id = s.flight_id
      JOIN airline ai ON ai.airline_id = f.airline_id
      JOIN aircraft ac ON ac.aircraft_id = f.aircraft_id
      JOIN airport src ON src.airport_id = f.source_airport_id
      JOIN airport dst ON dst.airport_id = f.destination_airport_id
      LEFT JOIN flight_instance fi
        ON fi.schedule_id = s.schedule_id
       AND fi.instance_date = s.date
      LEFT JOIN schedule_seat ss ON ss.schedule_id = s.schedule_id
      WHERE ${where.join(" AND ")}
      GROUP BY
        s.schedule_id,
        s.flight_id,
        s.date,
        s.departure_time,
        s.arrival_time,
        s.price,
        f.flight_number,
        f.duration,
        ai.name,
        ai.airline_code,
        ac.model,
        src.code,
        src.city,
        src.name,
        dst.code,
        dst.city,
        dst.name,
        fi.instance_id,
        fi.available_seats
      ORDER BY s.date ASC, s.departure_time ASC
    `,
    params
  );

  const flights = rows.map((row) => {
    const price = Number(row.schedule_price || 0);
    const seats = Number(row.available_seats || 0);

    // Dynamic tags based on real flight data
    const tags = [];
    if (seats > 0 && seats <= 10) tags.push("Few Seats Left");
    if (seats > 50) tags.push("Best Availability");
    tags.push("Non-stop");
    tags.push("Live Inventory");

    return {
      id: row.instance_id || row.schedule_id,
      flight_id: row.flight_id,
      schedule_id: row.schedule_id,
      instance_id: row.instance_id || null,
      departure_date: row.departure_date,
      flight_number: row.flight_number,
      airline: row.airline_name,
      airlineName: row.airline_name,
      airlineCode: row.airline_code,
      code: row.flight_number,
      aircraft: row.aircraft_model,
      cabin: String(req.query.cabin || "Economy").toUpperCase(),
      from: row.source_code,
      fromCity: row.source_city,
      fromAirport: row.source_airport,
      to: row.destination_code,
      toCity: row.destination_city,
      toAirport: row.destination_airport,
      source_city: row.source_city,
      destination_city: row.destination_city,
      time: row.departure_time,
      depart: row.departure_time,
      arrive: row.arrival_time,
      durationMinutes: Number(row.duration || 0),
      durationLabel: formatDuration(row.duration),
      price,
      oldPrice: price > 0 ? Math.round(price * 1.15) : 0,
      seats,
      tags,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.airline_name || "Airline")}&background=7048e8&color=fff&size=80&bold=true`,
    };
  });

  res.json({
    success: true,
    count: flights.length,
    flights,
    data: flights,
  });
});
