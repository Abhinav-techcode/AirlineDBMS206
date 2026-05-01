const express = require("express");

const { listAirports } = require("../controllers/metaController");

const router = express.Router();

router.get("/airports", listAirports);

module.exports = router;
