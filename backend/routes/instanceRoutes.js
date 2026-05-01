const express = require("express");
const router = express.Router();
const instanceController = require("../controllers/instanceController");

router.post("/", instanceController.createInstance);
router.get("/", instanceController.getInstances);

module.exports = router;
