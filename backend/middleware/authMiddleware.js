const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    const error = new Error("Authorization token is required.");
    error.statusCode = 401;
    throw error;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = "Invalid or expired authorization token.";
    throw error;
  }
});

module.exports = {
  protect,
};
