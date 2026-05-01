const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ensureEntity, quote } = require("../utils/schemaHelper");

const signToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      email: user.email || null,
      role: user.role || "CUSTOMER",
    },
    process.env.JWT_SECRET || "change-me",
    { expiresIn: "7d" }
  );

const serialiseUser = (row, users) => ({
  user_id: row[users.columns.id],
  name: users.columns.name ? row[users.columns.name] : null,
  email: users.columns.email ? row[users.columns.email] : null,
  role: users.columns.role ? row[users.columns.role] : "CUSTOMER",
});

const register = asyncHandler(async (req, res) => {
  const { entity: users } = await ensureEntity("users", ["id", "password"]);
  const { name, email, password, role = "CUSTOMER", username } = req.body;

  if (!password || (!email && !username && !name)) {
    const error = new Error("Registration requires password and at least one identifier.");
    error.statusCode = 400;
    throw error;
  }

  const lookupColumn = users.columns.email || users.columns.name;
  const lookupValue = (email || username || name)?.trim().toLowerCase();

  if (!lookupColumn) {
    const error = new Error(`User table "${users.table}" must include an email or name column for registration.`);
    error.statusCode = 500;
    throw error;
  }

  const [existingRows] = await pool.query(
    `SELECT ${quote(users.columns.id)} FROM ${quote(users.table)} WHERE LOWER(${quote(lookupColumn)}) = ? LIMIT 1`,
    [lookupValue]
  );

  if (existingRows.length > 0) {
    return res.status(409).json({
      message: "User already exists.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const insertColumns = [];
  const values = [];

  if (users.columns.name) {
    insertColumns.push(quote(users.columns.name));
    values.push(name || username || email || "Customer");
  }

  if (users.columns.email) {
    insertColumns.push(quote(users.columns.email));
    values.push(email || null);
  }

  if (users.columns.password) {
    insertColumns.push(quote(users.columns.password));
    values.push(hashedPassword);
  }

  if (users.columns.role) {
    insertColumns.push(quote(users.columns.role));
    values.push(role);
  }

  if (users.columns.createdAt) {
    insertColumns.push(quote(users.columns.createdAt));
    values.push(new Date());
  }

  const placeholders = insertColumns.map(() => "?").join(", ");
  const [insertResult] = await pool.query(
    `INSERT INTO ${quote(users.table)} (${insertColumns.join(", ")}) VALUES (${placeholders})`,
    values
  );

  const [createdRows] = await pool.query(
    `SELECT * FROM ${quote(users.table)} WHERE ${quote(users.columns.id)} = ? LIMIT 1`,
    [insertResult.insertId]
  );

  const createdUser = createdRows[0];
  const user = serialiseUser(createdUser, users);

  res.status(201).json({
    message: "Registration successful.",
    token: signToken(user),
    user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { entity: users } = await ensureEntity("users", ["id", "password"]);
  const { email, password, username, identifier, role } = req.body;

  const lookupValue = (identifier || email || username)?.trim().toLowerCase();

  if (!lookupValue || !password) {
    const error = new Error("Login requires an identifier and password.");
    error.statusCode = 400;
    throw error;
  }

  const whereParts = [];
  const params = [];

  if (users.columns.email) {
    whereParts.push(`LOWER(${quote(users.columns.email)}) = ?`);
    params.push(lookupValue);
  }

  if (users.columns.name) {
    whereParts.push(`LOWER(${quote(users.columns.name)}) = ?`);
    params.push(lookupValue);
  }

  if (whereParts.length === 0) {
    const error = new Error(`User table "${users.table}" must include an email or name column for login.`);
    error.statusCode = 500;
    throw error;
  }

  const [rows] = await pool.query(
    `SELECT * FROM ${quote(users.table)} WHERE ${whereParts.join(" OR ")} LIMIT 1`,
    params
  );

  const userRow = rows[0];

  if (!userRow) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  const storedPassword = String(userRow[users.columns.password] || "");
  const passwordMatches = storedPassword.startsWith("$2")
    ? await bcrypt.compare(password, storedPassword)
    : password === storedPassword;

  if (!passwordMatches) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  if (
    role &&
    users.columns.role &&
    String(userRow[users.columns.role]).toUpperCase() !== String(role).toUpperCase()
  ) {
    const error = new Error("User role does not match.");
    error.statusCode = 403;
    throw error;
  }

  const user = serialiseUser(userRow, users);

  res.json({
    message: "Login successful.",
    token: signToken(user),
    user,
  });
});

module.exports = {
  register,
  login,
};
