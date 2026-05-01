const express = require("express");
const { createFlight, getFlights, searchFlights } = require("../controllers/flightController");

const router = express.Router();

router.route("/").get(getFlights).post(createFlight);
router.get("/search", searchFlights);

module.exports = router;
