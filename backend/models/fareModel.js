const { pool } = require("../config/db");

const mapFareRow = (row) => ({
  fare_id: row.fare_id,
  id: row.fare_id,
  flight_id: row.flight_id,
  flight_number: row.flight_number,
  cabin: row.cabin,
  base_price: Number(row.base_price || 0),
  taxes: Number(row.taxes || 0),
  total_price: Number(row.total_price || 0),
  created_at: row.created_at || null,
  updated_at: row.updated_at || null,
});

const listFares = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        fare.fare_id,
        fare.flight_id,
        fare.cabin,
        fare.base_price,
        fare.taxes,
        fare.total_price,
        fare.created_at,
        fare.updated_at,
        flight.flight_number
      FROM fare
      JOIN flight ON flight.flight_id = fare.flight_id
      ORDER BY fare.fare_id DESC
    `
  );

  return rows.map(mapFareRow);
};

const createFare = async (payload) => {
  const basePrice = Number(payload.base_price || 0);
  const taxes = Number(payload.taxes || 0);
  const totalPrice = basePrice + taxes;

  const [result] = await pool.query(
    `
      INSERT INTO fare (flight_id, cabin, base_price, taxes, total_price)
      VALUES (?, ?, ?, ?, ?)
    `,
    [Number(payload.flight_id), payload.cabin || "ECONOMY", basePrice, taxes, totalPrice]
  );

  const [rows] = await pool.query(
    `
      SELECT
        fare.fare_id,
        fare.flight_id,
        fare.cabin,
        fare.base_price,
        fare.taxes,
        fare.total_price,
        fare.created_at,
        fare.updated_at,
        flight.flight_number
      FROM fare
      JOIN flight ON flight.flight_id = fare.flight_id
      WHERE fare.fare_id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  return mapFareRow(rows[0]);
};

module.exports = {
  listFares,
  createFare,
};
