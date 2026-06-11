const fs = require("fs");
const { readNetworkState, resolveAlgorithmState, statePath } = require("../services/networkMonitor");
const { enableTamperMode } = require("../utils/tamperManager");
const { fetchAnalytics } = require("../services/analyticsService");

let networkVariationTimer = null;
let activeQuality = 80; // Default startup quality
let driftDirection = -1; // -1 for downward, 1 for upward

function deriveMetricsFromQuality(Q) {
  return {
    latency: Math.round(350 - Q * 3.4),
    bandwidth: Number((Q * 0.5).toFixed(2)),
    packet_loss: Number((8 - Q * 0.08).toFixed(2)),
    jitter: Number((60 - Q * 0.58).toFixed(2)),
    throughput: Number((Q * 0.45).toFixed(2)),
    connection_stability: Number((30 + Q * 0.69).toFixed(2)),
    response_time: Math.round(500 - Q * 4.75),
    error_rate: Number((12 - Q * 0.12).toFixed(2))
  };
}

function deriveModeFromQuality(Q) {
  if (Q >= 90) return "excellent";
  if (Q >= 75) return "good";
  if (Q >= 60) return "moderate";
  if (Q >= 40) return "weak";
  return "poor";
}

function pushDecisionUpdates(io) {
  const resolved = resolveAlgorithmState();
  io.emit("algorithm_update", {
    currentAlgorithm: resolved.currentAlgorithm,
    previousAlgorithm: resolved.currentAlgorithm
  });
  io.emit("network_update", resolved.network);
  io.emit("analytics_update", fetchAnalytics(200));
}

function startNetworkVariation(io) {
  if (networkVariationTimer) clearInterval(networkVariationTimer);
  
  networkVariationTimer = setInterval(() => {
    // 1. Slow drift of the target quality anchor
    const delta = 1.5 * driftDirection;
    activeQuality = Math.max(5, Math.min(98, activeQuality + delta));

    // Turn around at thresholds to create a continuous cycle
    if (activeQuality >= 96) {
      driftDirection = -1;
    } else if (activeQuality <= 8) {
      driftDirection = 1;
    }
    
    // 2. Bounded random fluctuations for each individual metric
    const rand = (min, max) => min + Math.random() * (max - min);
    
    const baseLat = 350 - activeQuality * 3.4;
    const baseBw = activeQuality * 0.5;
    const baseLoss = 8 - activeQuality * 0.08;
    const baseJit = 60 - activeQuality * 0.58;
    const baseThru = activeQuality * 0.45;
    const baseStab = 30 + activeQuality * 0.69;
    const baseResp = 500 - activeQuality * 4.75;
    const baseErr = 12 - activeQuality * 0.12;

    const latency = Math.max(5, Math.min(450, Math.round(baseLat + rand(-25, 25))));
    const bandwidth = Math.max(0.1, Math.min(75, Number((baseBw + rand(-4, 4)).toFixed(2))));
    const packet_loss = Math.max(0, Math.min(15, Number((baseLoss + rand(-1, 1)).toFixed(2))));
    const jitter = Math.max(1, Math.min(80, Number((baseJit + rand(-4, 4)).toFixed(2))));
    const throughput = Math.max(0.1, Math.min(70, Number((baseThru + rand(-4, 4)).toFixed(2))));
    const connection_stability = Math.max(10, Math.min(100, Number((baseStab + rand(-8, 8)).toFixed(2))));
    const response_time = Math.max(15, Math.min(600, Math.round(baseResp + rand(-35, 35))));
    const error_rate = Math.max(0, Math.min(20, Number((baseErr + rand(-1.5, 1.5)).toFixed(2))));

    const metrics = {
      latency,
      bandwidth,
      packet_loss,
      jitter,
      throughput,
      connection_stability,
      response_time,
      error_rate
    };

    const { calculateQosScore, deriveQosStatus } = require("../services/algorithmSelector");
    const qosScore = calculateQosScore(metrics);
    const qosStatus = deriveQosStatus(qosScore);

    const sample = {
      mode: qosStatus.toLowerCase(),
      network_quality_score: qosScore,
      qos_score: qosScore,
      qos_status: qosStatus,
      ...metrics
    };

    fs.writeFileSync(statePath, JSON.stringify(sample, null, 2), "utf8");
    
    if (io) {
      pushDecisionUpdates(io);
    }
  }, 2000);
}

function executeSimulation(mode) {
  let startingQuality = 80;
  const lowerMode = (mode || "").toLowerCase();
  if (lowerMode === "excellent") startingQuality = 95;
  else if (lowerMode === "good") startingQuality = 82;
  else if (lowerMode === "moderate") startingQuality = 67;
  else if (lowerMode === "weak") startingQuality = 50;
  else if (lowerMode === "poor") startingQuality = 20;

  activeQuality = startingQuality;
  
  const baseLat = 350 - activeQuality * 3.4;
  const baseBw = activeQuality * 0.5;
  const baseLoss = 8 - activeQuality * 0.08;
  const baseJit = 60 - activeQuality * 0.58;
  const baseThru = activeQuality * 0.45;
  const baseStab = 30 + activeQuality * 0.69;
  const baseResp = 500 - activeQuality * 4.75;
  const baseErr = 12 - activeQuality * 0.12;

  const rand = (min, max) => min + Math.random() * (max - min);

  const latency = Math.max(5, Math.min(450, Math.round(baseLat + rand(-25, 25))));
  const bandwidth = Math.max(0.1, Math.min(75, Number((baseBw + rand(-4, 4)).toFixed(2))));
  const packet_loss = Math.max(0, Math.min(15, Number((baseLoss + rand(-1, 1)).toFixed(2))));
  const jitter = Math.max(1, Math.min(80, Number((baseJit + rand(-4, 4)).toFixed(2))));
  const throughput = Math.max(0.1, Math.min(70, Number((baseThru + rand(-4, 4)).toFixed(2))));
  const connection_stability = Math.max(10, Math.min(100, Number((baseStab + rand(-8, 8)).toFixed(2))));
  const response_time = Math.max(15, Math.min(600, Math.round(baseResp + rand(-35, 35))));
  const error_rate = Math.max(0, Math.min(20, Number((baseErr + rand(-1.5, 1.5)).toFixed(2))));

  const metrics = {
    latency,
    bandwidth,
    packet_loss,
    jitter,
    throughput,
    connection_stability,
    response_time,
    error_rate
  };

  const { calculateQosScore, deriveQosStatus } = require("../services/algorithmSelector");
  const qosScore = calculateQosScore(metrics);
  const qosStatus = deriveQosStatus(qosScore);

  const sample = {
    mode: qosStatus.toLowerCase(),
    network_quality_score: qosScore,
    qos_score: qosScore,
    qos_status: qosStatus,
    ...metrics
  };

  fs.writeFileSync(statePath, JSON.stringify(sample, null, 2), "utf8");
  return readNetworkState();
}

async function simulateNetwork(req, res) {
  try {
    const { mode } = req.params;
    const normalizedMode = (mode || "").toLowerCase();
    if (!["excellent", "good", "moderate", "weak", "poor"].includes(normalizedMode)) {
      return res.status(400).json({ message: "Invalid network simulation mode." });
    }
    
    const state = executeSimulation(normalizedMode);
    const io = req.app.get("io");
    if (io) {
      pushDecisionUpdates(io);
      startNetworkVariation(io);
    }
    
    return res.json({
      message: `Network mode changed to ${normalizedMode} (Quality Score: ${activeQuality})`,
      state
    });
  } catch (error) {
    return res.status(500).json({ message: "Network simulation failed.", error: error.message });
  }
}

function simulateTamper(req, res) {
  enableTamperMode();
  const io = req.app.get("io");
  if (io) {
    io.emit("integrity_alert", {
      message: "Tamper mode active. Next packet will be modified.",
      timestamp: new Date().toISOString()
    });
  }
  return res.json({
    message: "Tamper simulation armed for next packet"
  });
}

function getNetworkState(req, res) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return res.json({ state });
  } catch (error) {
    return res.status(500).json({ message: "Unable to read network state.", error: error.message });
  }
}

function initSimulation(io) {
  startNetworkVariation(io);
}

module.exports = { simulateNetwork, getNetworkState, executeSimulation, simulateTamper, initSimulation };
