const { pool } = require("../config/db");
const { ensureInstanceForSchedule, getAircraftCapacity, getBookedSeatCountForSchedule } = require("../utils/seatLayout");

const mapInstanceRow = (row) => ({
  instance_id: row.instance_id,
  id: row.instance_id,
  schedule_id: row.schedule_id,
  flight_id: row.flight_id,
  flight_number: row.flight_number,
  airline_name: row.airline_name,
  airline_code: row.airline_code,
  aircraft_id: row.aircraft_id,
  aircraft_code: row.aircraft_code || row.registration_code || `AC${row.aircraft_id}`,
  aircraft_model: row.aircraft_model,
  route: `${row.source_code} - ${row.destination_code}`,
  departure_code: row.source_code,
  arrival_code: row.destination_code,
  departure_city: row.source_city,
  arrival_city: row.destination_city,
  departure_airport: row.source_airport,
  arrival_airport: row.destination_airport,
  departure_time: row.departure_time,
  arrival_time: row.arrival_time,
  departure_date: row.instance_date,
  departure_at: `${row.instance_date} ${row.departure_time}`,
  arrival_at: `${row.instance_date} ${row.arrival_time}`,
  capacity: Number(row.capacity || 0),
  available_seats: Number(row.available_seats || 0),
  booked_seats: Number(row.booked_seats || 0),
  status: row.status || "SCHEDULED",
  duration_minutes: Number(row.duration || 0),
  on_time_performance: "95%",
  load_factor: `${Math.round(
    Number(row.capacity || 0) > 0 ? (Number(row.booked_seats || 0) / Number(row.capacity || 1)) * 100 : 0
  )}%`,
  revenue_index: "Live",
  safety_rating: "5.0",
  amenities: ["Wi-Fi", "Beverages", "Meals", "Entertainment"],
});

const instanceSelect = `
  SELECT
    fi.instance_id,
    fi.schedule_id,
    fi.instance_date,
    fi.capacity,
    fi.available_seats,
    fi.booked_seats,
    fi.status,
    s.flight_id,
    f.flight_number,
    f.duration,
    f.aircraft_id,
    ai.name AS airline_name,
    ai.airline_code,
    ac.model AS aircraft_model,
    ac.registration_code,
    src.code AS source_code,
    src.city AS source_city,
    src.name AS source_airport,
    dst.code AS destination_code,
    dst.city AS destination_city,
    dst.name AS destination_airport,
    TIME_FORMAT(s.departure_time, '%H:%i:%s') AS departure_time,
    TIME_FORMAT(s.arrival_time, '%H:%i:%s') AS arrival_time
  FROM flight_instance fi
  JOIN schedule s ON s.schedule_id = fi.schedule_id
  JOIN flight f ON f.flight_id = s.flight_id
  JOIN airline ai ON ai.airline_id = f.airline_id
  JOIN aircraft ac ON ac.aircraft_id = f.aircraft_id
  JOIN airport src ON src.airport_id = f.source_airport_id
  JOIN airport dst ON dst.airport_id = f.destination_airport_id
`;

const listInstances = async () => {
  const [rows] = await pool.query(`
    ${instanceSelect}
    ORDER BY fi.instance_date DESC, s.departure_time ASC
  `);

  return rows.map(mapInstanceRow);
};

const createInstance = async (payload) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const scheduleId = Number(payload.schedule_id);
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

    const resolvedDate = payload.date || payload.instance_date || scheduleRows[0].date;
    const capacity = await getAircraftCapacity(connection, scheduleRows[0].aircraft_id);
    const bookedSeats = await getBookedSeatCountForSchedule(connection, scheduleId);
    const availableSeats = Math.max(capacity - bookedSeats, 0);

    const [existingRows] = await connection.query(
      `
        SELECT instance_id
        FROM flight_instance
        WHERE schedule_id = ?
          AND instance_date = ?
        LIMIT 1
      `,
      [scheduleId, resolvedDate]
    );

    let instanceId = existingRows[0]?.instance_id || null;

    if (instanceId) {
      await connection.query(
        `
          UPDATE flight_instance
          SET capacity = ?,
              available_seats = ?,
              booked_seats = ?,
              status = ?
          WHERE instance_id = ?
        `,
        [capacity, availableSeats, bookedSeats, payload.status || "SCHEDULED", instanceId]
      );
    } else {
      const createdInstance = await ensureInstanceForSchedule(connection, scheduleId, resolvedDate);
      instanceId = createdInstance.instance_id;

      await connection.query(
        `
          UPDATE flight_instance
          SET status = ?
          WHERE instance_id = ?
        `,
        [payload.status || "SCHEDULED", instanceId]
      );
    }

    await connection.commit();

    const [rows] = await connection.query(
      `
        ${instanceSelect}
        WHERE fi.instance_id = ?
        LIMIT 1
      `,
      [instanceId]
    );

    return mapInstanceRow(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listInstances,
  createInstance,
};
