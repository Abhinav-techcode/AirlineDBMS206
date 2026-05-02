const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// MySQL error codes that should not be exposed to clients
const SQL_ERROR_CODES = new Set([
  "ER_PARSE_ERROR",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_NO_SUCH_TABLE",
  "ER_DUP_ENTRY",
  "ER_LOCK_DEADLOCK",
  "ER_LOCK_WAIT_TIMEOUT",
  "ER_DATA_TOO_LONG",
  "ER_TRUNCATED_WRONG_VALUE",
  "ER_BAD_FIELD_ERROR",
]);

const isSqlError = (error) =>
  error.sqlState != null ||
  error.sqlMessage != null ||
  SQL_ERROR_CODES.has(error.code) ||
  (error.code && String(error.code).startsWith("ER_"));

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || error.status || 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  // Never expose raw SQL errors to clients
  const clientMessage =
    isSqlError(error) && statusCode >= 500
      ? "A database error occurred. Please try again later."
      : error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    code: isSqlError(error) ? "DB_ERROR" : error.code || null,
    details: error.details || null,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
