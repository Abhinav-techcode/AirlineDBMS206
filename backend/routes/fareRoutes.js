const express = require("express");
const router = express.Router();
const fareController = require("../controllers/fareController");

router.post("/", fareController.createFare);
router.get("/", fareController.getFares);

module.exports = router;
