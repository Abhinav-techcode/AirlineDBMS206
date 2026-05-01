const express = require("express");
const router = express.Router();
const aircraftController = require("../controllers/aircraftController");

router.post("/", aircraftController.createAircraft);
router.get("/", aircraftController.getAircraft);

module.exports = router;
