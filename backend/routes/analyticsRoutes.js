const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { fetchAnalyticsController } = require("../controllers/analyticsController");

const router = express.Router();
router.get("/", authMiddleware, fetchAnalyticsController);

module.exports = router;
