const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { simulateNetwork, getNetworkState } = require("../controllers/networkController");

const router = express.Router();
router.get("/state", authMiddleware, getNetworkState);
router.post("/simulate/:mode", simulateNetwork);
router.post("/:mode", simulateNetwork);

module.exports = router;
