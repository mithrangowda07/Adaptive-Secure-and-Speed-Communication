const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  simulateNetwork,
  getNetworkState,
  simulateTamper
} = require("../controllers/networkController");

const router = express.Router();
router.get("/state", authMiddleware, getNetworkState);
router.post("/tamper", simulateTamper);
router.post("/network/:mode", simulateNetwork);
router.post("/simulate/network/:mode", simulateNetwork);
router.post("/:mode", simulateNetwork);

module.exports = router;
