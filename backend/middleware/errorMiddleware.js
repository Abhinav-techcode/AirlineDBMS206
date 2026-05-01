const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || error.status || 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    code: error.code || null,
    details: error.details || null,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
