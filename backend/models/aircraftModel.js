const { pool } = require("../config/db");
const { createAircraftSeats } = require("../utils/seatLayout");

const buildCabinLayouts = (aircraft) => {
  const totalSeats = Number(aircraft.total_seats || 0);
  const firstClassSeats = Number(aircraft.first_class_seats || 0);
  const businessSeats = Number(aircraft.business_seats || 0);
  const economySeats = Math.max(totalSeats - firstClassSeats - businessSeats, 0);

  return [
    {
      id: `first-${aircraft.aircraft_id}`,
      name: "FIRST",
      tag: "First",
      active: firstClassSeats > 0,
      totalSeats: firstClassSeats,
      availableSeats: firstClassSeats,
      totalRows: Math.ceil(firstClassSeats / 4) || 0,
      seatsPerRow: "4",
      layoutName: "First Class Layout",
      leftSeats: 2,
      rightSeats: 2,
    },
    {
      id: `business-${aircraft.aircraft_id}`,
      name: "BUSINESS",
      tag: "Business",
      active: businessSeats > 0,
      totalSeats: businessSeats,
      availableSeats: businessSeats,
      totalRows: Math.ceil(businessSeats / 4) || 0,
      seatsPerRow: "4",
      layoutName: "Business Class Layout",
      leftSeats: 2,
      rightSeats: 2,
    },
    {
      id: `economy-${aircraft.aircraft_id}`,
      name: "ECONOMY",
      tag: "Economy",
      active: economySeats > 0,
      totalSeats: economySeats,
      availableSeats: economySeats,
      totalRows: Math.ceil(economySeats / 6) || 0,
      seatsPerRow: "6",
      layoutName: "Economy Layout",
      leftSeats: 3,
      rightSeats: 3,
    },
  ].filter((layout) => layout.totalSeats > 0);
};

const mapAircraftRow = (row) => ({
  aircraft_id: row.aircraft_id,
  id: row.aircraft_id,
  airline_id: row.airline_id,
  model: row.model,
  code: row.registration_code || `AC${row.aircraft_id}`,
  registration_code: row.registration_code || null,
  total_seats: Number(row.total_seats || 0),
  business_seats: Number(row.business_seats || 0),
  first_class_seats: Number(row.first_class_seats || 0),
  range_km: Number(row.range_km || 0),
  cruising_speed: Number(row.cruising_speed || 0),
  max_altitude: Number(row.max_altitude || 0),
  status: row.status || "ACTIVE",
  is_available: Boolean(row.is_available),
  registration_date: row.registration_date || null,
  next_maintenance_date: row.next_maintenance_date || null,
  configuration: row.configuration || "Standard",
  cabinLayouts: buildCabinLayouts(row),
});

const listAircraft = async () => {
  const [rows] = await pool.query(
    `
      SELECT *
      FROM aircraft
      ORDER BY aircraft_id DESC
    `
  );

  return rows.map(mapAircraftRow);
};

const createAircraft = async (payload) => {
  const businessSeats = Number(payload.business_seats || 0);
  const firstClassSeats = Number(payload.first_class_seats || 0);
  const totalSeats =
    Number(payload.total_seats || payload.capacity || 0) ||
    Math.max(businessSeats + firstClassSeats, 0) ||
    180;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO aircraft (
          airline_id,
          model,
          registration_code,
          total_seats,
          business_seats,
          first_class_seats,
          range_km,
          cruising_speed,
          max_altitude,
          status,
          is_available,
          registration_date,
          next_maintenance_date,
          configuration
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(payload.airline_id || 1),
        payload.model,
        payload.registration_code || null,
        totalSeats,
        businessSeats,
        firstClassSeats,
        payload.range_km ? Number(payload.range_km) : null,
        payload.cruising_speed ? Number(payload.cruising_speed) : null,
        payload.max_altitude ? Number(payload.max_altitude) : null,
        payload.status || "ACTIVE",
        payload.is_available ? 1 : 0,
        payload.registration_date || null,
        payload.next_maintenance_date || null,
        payload.configuration || "Standard",
      ]
    );

    await createAircraftSeats(connection, result.insertId, totalSeats);
    await connection.commit();

    const [rows] = await connection.query(
      `
        SELECT *
        FROM aircraft
        WHERE aircraft_id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return mapAircraftRow(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listAircraft,
  createAircraft,
};
