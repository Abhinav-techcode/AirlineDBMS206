const express = require("express");
const { getAdminDashboard} = require("../controllers/adminController");
const router = express.Router();

router.get("/dashboard", getAdminDashboard);



module.exports = router;