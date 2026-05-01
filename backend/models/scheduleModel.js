const { pool } = require("../config/db");
const { createScheduleSeats } = require("../utils/seatLayout");

const mapScheduleRow = (row) => ({
  schedule_id: row.schedule_id,
  id: row.schedule_id,
  flight_id: row.flight_id,
  flight_number: row.flight_number,
  source_code: row.source_code,
  source_city: row.source_city,
  source_airport: row.source_airport,
  destination_code: row.destination_code,
  destination_city: row.destination_city,
  destination_airport: row.destination_airport,
  route: `${row.source_code} - ${row.destination_code}`,
  departure_time: row.departure_time,
  arrival_time: row.arrival_time,
  date: row.date,
  departure_date: row.date,
  price: Number(row.price || 0),
  status: row.status || "SCHEDULED",
  booked_count: Number(row.booked_count || 0),
});

const listSchedules = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        s.schedule_id,
        s.flight_id,
        f.flight_number,
        src.code AS source_code,
        src.city AS source_city,
        src.name AS source_airport,
        dst.code AS destination_code,
        dst.city AS destination_city,
        dst.name AS destination_airport,
        TIME_FORMAT(s.departure_time, '%H:%i:%s') AS departure_time,
        TIME_FORMAT(s.arrival_time, '%H:%i:%s') AS arrival_time,
        s.date,
        s.price,
        s.status,
        SUM(CASE WHEN UPPER(COALESCE(ss.status, 'AVAILABLE')) = 'BOOKED' THEN 1 ELSE 0 END) AS booked_count
      FROM schedule s
      JOIN flight f ON f.flight_id = s.flight_id
      JOIN airport src ON src.airport_id = f.source_airport_id
      JOIN airport dst ON dst.airport_id = f.destination_airport_id
      LEFT JOIN schedule_seat ss ON ss.schedule_id = s.schedule_id
      GROUP BY
        s.schedule_id,
        s.flight_id,
        f.flight_number,
        src.code,
        src.city,
        src.name,
        dst.code,
        dst.city,
        dst.name,
        s.departure_time,
        s.arrival_time,
        s.date,
        s.price,
        s.status
      ORDER BY s.date DESC, s.departure_time ASC
    `
  );

  return rows.map(mapScheduleRow);
};

const createSchedule = async (payload) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [flightRows] = await connection.query(
      `
        SELECT aircraft_id
        FROM flight
        WHERE flight_id = ?
        LIMIT 1
      `,
      [Number(payload.flight_id)]
    );

    if (!flightRows[0]) {
      const error = new Error("Flight not found.");
      error.statusCode = 404;
      throw error;
    }

    const [result] = await connection.query(
      `
        INSERT INTO schedule (flight_id, departure_time, arrival_time, date, price, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        Number(payload.flight_id),
        payload.departure_time,
        payload.arrival_time,
        payload.date,
        Number(payload.price || 0),
        payload.status || "SCHEDULED",
      ]
    );

    await createScheduleSeats(connection, result.insertId, flightRows[0].aircraft_id);
    await connection.commit();

    const [rows] = await connection.query(
      `
        SELECT
          s.schedule_id,
          s.flight_id,
          f.flight_number,
          src.code AS source_code,
          src.city AS source_city,
          src.name AS source_airport,
          dst.code AS destination_code,
          dst.city AS destination_city,
          dst.name AS destination_airport,
          TIME_FORMAT(s.departure_time, '%H:%i:%s') AS departure_time,
          TIME_FORMAT(s.arrival_time, '%H:%i:%s') AS arrival_time,
          s.date,
          s.price,
          s.status,
          0 AS booked_count
        FROM schedule s
        JOIN flight f ON f.flight_id = s.flight_id
        JOIN airport src ON src.airport_id = f.source_airport_id
        JOIN airport dst ON dst.airport_id = f.destination_airport_id
        WHERE s.schedule_id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return mapScheduleRow(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listSchedules,
  createSchedule,
};
