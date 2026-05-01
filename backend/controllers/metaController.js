const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ensureEntity, quote } = require("../utils/schemaHelper");

const listAirports = asyncHandler(async (req, res) => {
  const { entity: airports } = await ensureEntity("airports", ["id", "code", "city", "name"]);

  const [rows] = await pool.query(
    `
      SELECT
        ${quote(airports.columns.id)} AS airport_id,
        ${quote(airports.columns.code)} AS code,
        ${quote(airports.columns.city)} AS city,
        ${quote(airports.columns.name)} AS name
      FROM ${quote(airports.table)}
      ORDER BY ${quote(airports.columns.city)} ASC, ${quote(airports.columns.code)} ASC
    `
  );

  res.json({
    success: true,
    count: rows.length,
    airports: rows,
    data: rows,
  });
});

module.exports = {
  listAirports,
};
