const { pool } = require("../config/db");

const mapFlightRow = (row) => ({
  flight_id: row.flight_id,
  id: row.flight_id,
  flight_number: row.flight_number,
  airline_id: row.airline_id,
  airline_name: row.airline_name,
  airline_code: row.airline_code,
  aircraft_id: row.aircraft_id,
  aircraft_model: row.aircraft_model,
  aircraft_code: row.aircraft_code || row.registration_code || null,
  source_airport_id: row.source_airport_id,
  destination_airport_id: row.destination_airport_id,
  source_code: row.source_code,
  source_city: row.source_city,
  source_airport: row.source_airport,
  destination_code: row.destination_code,
  destination_city: row.destination_city,
  destination_airport: row.destination_airport,
  duration: Number(row.duration || 0),
  status: row.status || "SCHEDULED",
  route: `${row.source_code} - ${row.destination_code}`,
  schedules_count: Number(row.schedules_count || 0),
  starting_price: Number(row.starting_price || 0),
});

const getFlightsBaseQuery = `
  SELECT
    f.flight_id,
    f.flight_number,
    f.airline_id,
    ai.name AS airline_name,
    ai.airline_code,
    f.aircraft_id,
    ac.model AS aircraft_model,
    ac.registration_code,
    src.airport_id AS source_airport_id,
    src.code AS source_code,
    src.city AS source_city,
    src.name AS source_airport,
    dst.airport_id AS destination_airport_id,
    dst.code AS destination_code,
    dst.city AS destination_city,
    dst.name AS destination_airport,
    f.duration,
    COUNT(DISTINCT s.schedule_id) AS schedules_count,
    MIN(COALESCE(s.price, 0)) AS starting_price
  FROM flight f
  JOIN airline ai ON ai.airline_id = f.airline_id
  JOIN aircraft ac ON ac.aircraft_id = f.aircraft_id
  JOIN airport src ON src.airport_id = f.source_airport_id
  JOIN airport dst ON dst.airport_id = f.destination_airport_id
  LEFT JOIN schedule s ON s.flight_id = f.flight_id
  GROUP BY
    f.flight_id,
    f.flight_number,
    f.airline_id,
    ai.name,
    ai.airline_code,
    f.aircraft_id,
    ac.model,
    ac.registration_code,
    src.airport_id,
    src.code,
    src.city,
    src.name,
    dst.airport_id,
    dst.code,
    dst.city,
    dst.name,
    f.duration
`;

const listFlights = async () => {
  const [rows] = await pool.query(`
    ${getFlightsBaseQuery}
    ORDER BY f.flight_id DESC
  `);
  return rows.map(mapFlightRow);
};

const createFlight = async (payload) => {
  const [result] = await pool.query(
    `
      INSERT INTO flight (
        flight_number,
        airline_id,
        aircraft_id,
        source_airport_id,
        destination_airport_id,
        duration
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      payload.flight_number,
      Number(payload.airline_id || 1),
      Number(payload.aircraft_id),
      Number(payload.source_airport_id),
      Number(payload.destination_airport_id),
      Number(payload.duration || 0),
    ]
  );

  const [rows] = await pool.query(
    `
      ${getFlightsBaseQuery}
      HAVING f.flight_id = ?
    `,
    [result.insertId]
  );

  return mapFlightRow(rows[0]);
};

module.exports = {
  listFlights,
  createFlight,
};
