const fs = require("fs");
const { readNetworkState, resolveAlgorithmState, statePath } = require("../services/networkMonitor");
const { enableTamperMode } = require("../utils/tamperManager");
const { readSecurityState, writeSecurityState, buildStateFromLevel } = require("../utils/securitySimulationState");

let networkVariationTimer = null;
let securityVariationTimer = null;

function randomFromRange(min, max, precision = 2) {
  return Number((min + Math.random() * (max - min)).toFixed(precision));
}

function readRange(input, fallback) {
  if (Array.isArray(input) && input.length === 2) return [Number(input[0]), Number(input[1])];
  if (input && typeof input === "object" && input.min !== undefined && input.max !== undefined) {
    return [Number(input.min), Number(input.max)];
  }
  return fallback;
}

function rangesForMode(mode) {
  if (mode === "normal") {
    return {
      latency: [10, 40],
      bandwidth: [20, 50],
      packet_loss: [0, 1],
      jitter: [2, 8],
      throughput: [18, 45],
      connection_stability: [88, 99],
      response_time: [25, 80],
      error_rate: [0, 1]
    };
  }
  if (mode === "moderate") {
    return {
      latency: [60, 120],
      bandwidth: [5, 15],
      packet_loss: [1, 3],
      jitter: [8, 20],
      throughput: [6, 18],
      connection_stability: [60, 88],
      response_time: [80, 180],
      error_rate: [1, 4]
    };
  }
  return {
    latency: [200, 350],
    bandwidth: [0.5, 3],
    packet_loss: [3, 8],
    jitter: [20, 60],
    throughput: [0.5, 6],
    connection_stability: [30, 65],
    response_time: [180, 500],
    error_rate: [4, 12]
  };
}

function mergeRanges(defaults, incomingRanges = {}) {
  return {
    latency: readRange(incomingRanges.latency, defaults.latency),
    bandwidth: readRange(incomingRanges.bandwidth, defaults.bandwidth),
    packet_loss: readRange(incomingRanges.packet_loss, defaults.packet_loss),
    jitter: readRange(incomingRanges.jitter, defaults.jitter),
    throughput: readRange(incomingRanges.throughput, defaults.throughput),
    connection_stability: readRange(
      incomingRanges.connection_stability,
      defaults.connection_stability
    ),
    response_time: readRange(incomingRanges.response_time, defaults.response_time),
    error_rate: readRange(incomingRanges.error_rate, defaults.error_rate)
  };
}

function buildNetworkSample(mode, ranges) {
  return {
    mode,
    latency: randomFromRange(ranges.latency[0], ranges.latency[1], 0),
    bandwidth: randomFromRange(ranges.bandwidth[0], ranges.bandwidth[1], 2),
    packet_loss: randomFromRange(ranges.packet_loss[0], ranges.packet_loss[1], 2),
    jitter: randomFromRange(ranges.jitter[0], ranges.jitter[1], 2),
    throughput: randomFromRange(ranges.throughput[0], ranges.throughput[1], 2),
    connection_stability: randomFromRange(
      ranges.connection_stability[0],
      ranges.connection_stability[1],
      2
    ),
    response_time: randomFromRange(ranges.response_time[0], ranges.response_time[1], 0),
    error_rate: randomFromRange(ranges.error_rate[0], ranges.error_rate[1], 2)
  };
}

function pushDecisionUpdates(io) {
  const resolved = resolveAlgorithmState();
  io.emit("algorithm_update", {
    currentAlgorithm: resolved.currentAlgorithm,
    previousAlgorithm: resolved.currentAlgorithm
  });
  const securityState = readSecurityState();
  io.emit("security_update", {
    securityScore: securityState.simulatedScore,
    riskLevel: securityState.riskLevel,
    integrityStatus: securityState.integrityStatus || "VERIFIED",
    keyId: resolved.securityState?.keyId || 1,
    algorithmReason: resolved.decision.reason,
    performanceLevel: resolved.decision.performanceLevel,
    securityParams: securityState.security_params || null
  });
}

function startNetworkVariation(io, mode, activeRanges) {
  if (networkVariationTimer) clearInterval(networkVariationTimer);
  let ticks = 0;
  networkVariationTimer = setInterval(() => {
    ticks += 1;
    const next = buildNetworkSample(mode, activeRanges);
    fs.writeFileSync(statePath, JSON.stringify(next, null, 2), "utf8");
    io.emit("network_update", readNetworkState());
    pushDecisionUpdates(io);
    if (ticks >= 8) {
      clearInterval(networkVariationTimer);
      networkVariationTimer = null;
    }
  }, 1000);
}

function startSecurityVariation(io, level) {
  if (securityVariationTimer) clearInterval(securityVariationTimer);
  let ticks = 0;
  securityVariationTimer = setInterval(() => {
    ticks += 1;
    const next = buildStateFromLevel(level);
    writeSecurityState(next);
    pushDecisionUpdates(io);
    if (ticks >= 8) {
      clearInterval(securityVariationTimer);
      securityVariationTimer = null;
    }
  }, 1000);
}

function executeSimulation(mode, customRanges = {}) {
  const baseRanges = rangesForMode(mode);
  const activeRanges = mergeRanges(baseRanges, customRanges);
  const sample = buildNetworkSample(mode, activeRanges);
  fs.writeFileSync(statePath, JSON.stringify(sample, null, 2), "utf8");
  return { state: readNetworkState(), activeRanges };
}

async function simulateNetwork(req, res) {
  try {
    const { mode } = req.params;
    if (!["normal", "moderate", "slow"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode." });
    }
    const { state, activeRanges } = executeSimulation(mode, req.body?.ranges || req.body || {});
    const algorithm = resolveAlgorithmState().currentAlgorithm;
    const io = req.app.get("io");
    if (io) {
      io.emit("network_update", state);
      pushDecisionUpdates(io);
      startNetworkVariation(io, mode, activeRanges);
    }
    return res.json({
      message: `Network mode changed to ${mode}`,
      algorithm,
      state,
      ranges: activeRanges
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

function simulateSecurity(req, res) {
  const { level } = req.params;
  if (!["low", "medium", "high"].includes((level || "").toLowerCase())) {
    return res.status(400).json({ message: "Invalid security level. Use low|medium|high." });
  }
  const next = buildStateFromLevel(level, req.body?.ranges || req.body || {});
  writeSecurityState(next);
  const io = req.app.get("io");
  let algorithm = "ECC";
  if (io) {
    pushDecisionUpdates(io);
    startSecurityVariation(io, level.toLowerCase());
    algorithm = resolveAlgorithmState().currentAlgorithm;
  } else {
    algorithm = resolveAlgorithmState().currentAlgorithm;
  }
  return res.json({
    message: `Security level changed to ${level.toLowerCase()}`,
    algorithm,
    security: next,
    ranges: next.activeRanges
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

module.exports = { simulateNetwork, getNetworkState, executeSimulation, simulateTamper, simulateSecurity };
