const { pool } = require("../config/db");

const SEAT_COLUMNS = ["A", "B", "C", "D", "E", "F"];

const generateSeatRows = (totalSeats) => {
  const targetSeatCount = Math.max(0, Number(totalSeats) || 0);
  const seats = [];

  for (let index = 0; index < targetSeatCount; index += 1) {
    const rowNumber = Math.floor(index / SEAT_COLUMNS.length) + 1;
    const seatLabel = SEAT_COLUMNS[index % SEAT_COLUMNS.length];
    seats.push({
      seat_no: `${rowNumber}${seatLabel}`,
      seat_row: rowNumber,
      seat_label: seatLabel,
      seat_type: "NORMAL",
    });
  }

  return seats;
};

const createAircraftSeats = async (connection, aircraftId, totalSeats) => {
  const [existingRows] = await connection.query(
    `
      SELECT seat_id
      FROM seat
      WHERE aircraft_id = ?
      LIMIT 1
    `,
    [aircraftId]
  );

  if (existingRows.length > 0) {
    return;
  }

  const seats = generateSeatRows(totalSeats);
  if (seats.length === 0) {
    return;
  }

  const values = seats.flatMap((seat) => [
    aircraftId,
    seat.seat_no,
    seat.seat_row,
    seat.seat_label,
    seat.seat_type,
  ]);

  const placeholders = seats.map(() => "(?, ?, ?, ?, ?)").join(", ");

  await connection.query(
    `
      INSERT INTO seat (aircraft_id, seat_no, seat_row, seat_label, seat_type)
      VALUES ${placeholders}
    `,
    values
  );
};

const createScheduleSeats = async (connection, scheduleId, aircraftId) => {
  const [existingRows] = await connection.query(
    `
      SELECT schedule_seat_id
      FROM schedule_seat
      WHERE schedule_id = ?
      LIMIT 1
    `,
    [scheduleId]
  );

  if (existingRows.length > 0) {
    return;
  }

  const [seatRows] = await connection.query(
    `
      SELECT seat_id
      FROM seat
      WHERE aircraft_id = ?
      ORDER BY seat_row ASC, seat_label ASC
    `,
    [aircraftId]
  );

  if (seatRows.length === 0) {
    throw new Error("No seat layout exists for the selected aircraft.");
  }

  const values = seatRows.flatMap((seat) => [scheduleId, seat.seat_id, "AVAILABLE"]);
  const placeholders = seatRows.map(() => "(?, ?, ?, NOW())").join(", ");

  await connection.query(
    `
      INSERT INTO schedule_seat (schedule_id, seat_id, status, last_updated)
      VALUES ${placeholders}
    `,
    values
  );
};

const getAircraftCapacity = async (connection, aircraftId) => {
  const [rows] = await connection.query(
    `
      SELECT total_seats
      FROM aircraft
      WHERE aircraft_id = ?
      LIMIT 1
    `,
    [aircraftId]
  );

  return Number(rows[0]?.total_seats || 0);
};

const getBookedSeatCountForSchedule = async (connection, scheduleId) => {
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS booked_count
      FROM schedule_seat
      WHERE schedule_id = ?
        AND UPPER(status) = 'BOOKED'
    `,
    [scheduleId]
  );

  return Number(rows[0]?.booked_count || 0);
};

const ensureInstanceForSchedule = async (connection, scheduleId, instanceDate = null) => {
  const [scheduleRows] = await connection.query(
    `
      SELECT s.schedule_id, s.date, f.aircraft_id
      FROM schedule s
      JOIN flight f ON f.flight_id = s.flight_id
      WHERE s.schedule_id = ?
      LIMIT 1
    `,
    [scheduleId]
  );

  if (!scheduleRows[0]) {
    const error = new Error("Schedule not found.");
    error.statusCode = 404;
    throw error;
  }

  const resolvedDate = instanceDate || scheduleRows[0].date;
  if (!resolvedDate) {
    const error = new Error("A travel date is required to create or resolve a flight instance.");
    error.statusCode = 400;
    throw error;
  }

  const [instanceRows] = await connection.query(
    `
      SELECT *
      FROM flight_instance
      WHERE schedule_id = ?
        AND instance_date = ?
      LIMIT 1
      FOR UPDATE
    `,
    [scheduleId, resolvedDate]
  );

  if (instanceRows[0]) {
    return instanceRows[0];
  }

  const capacity = await getAircraftCapacity(connection, scheduleRows[0].aircraft_id);
  const bookedSeats = await getBookedSeatCountForSchedule(connection, scheduleId);
  const availableSeats = Math.max(capacity - bookedSeats, 0);

  const [result] = await connection.query(
    `
      INSERT INTO flight_instance (schedule_id, instance_date, capacity, available_seats, booked_seats, status)
      VALUES (?, ?, ?, ?, ?, 'SCHEDULED')
    `,
    [scheduleId, resolvedDate, capacity, availableSeats, bookedSeats]
  );

  return {
    instance_id: result.insertId,
    schedule_id: scheduleId,
    instance_date: resolvedDate,
    capacity,
    available_seats: availableSeats,
    booked_seats: bookedSeats,
    status: "SCHEDULED",
  };
};

module.exports = {
  generateSeatRows,
  createAircraftSeats,
  createScheduleSeats,
  getAircraftCapacity,
  getBookedSeatCountForSchedule,
  ensureInstanceForSchedule,
  pool,
};
