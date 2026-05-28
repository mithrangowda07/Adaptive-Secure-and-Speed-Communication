const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  simulateNetwork,
  getNetworkState,
  simulateTamper,
  simulateSecurity
} = require("../controllers/networkController");

const router = express.Router();
router.get("/state", authMiddleware, getNetworkState);
router.post("/tamper", simulateTamper);
router.post("/security/:level", simulateSecurity);
router.post("/simulate/:mode", simulateNetwork);
router.post("/:mode", simulateNetwork);

module.exports = router;
