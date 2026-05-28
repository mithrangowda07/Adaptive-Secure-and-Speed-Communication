const fs = require("fs");
const path = require("path");

const securityStatePath = path.join(__dirname, "..", "security_state.json");

const LEVEL_MAP = {
  low: {
    cpu_usage: [20, 45],
    attack_risk: [0, 0.7],
    integrity_penalty: [0, 0.8],
    anomaly_score: [5, 25],
    auth_fail_rate: [0, 1],
    threat_signal: [0, 20]
  },
  medium: {
    cpu_usage: [46, 70],
    attack_risk: [0.8, 1.6],
    integrity_penalty: [0.8, 1.8],
    anomaly_score: [25, 55],
    auth_fail_rate: [1, 4],
    threat_signal: [20, 60]
  },
  high: {
    cpu_usage: [71, 95],
    attack_risk: [1.7, 3],
    integrity_penalty: [1.8, 4],
    anomaly_score: [55, 90],
    auth_fail_rate: [4, 10],
    threat_signal: [60, 100]
  }
};

function ensureStateFile() {
  if (!fs.existsSync(securityStatePath)) {
    fs.writeFileSync(
      securityStatePath,
      JSON.stringify(
        {
          level: "medium",
          riskLevel: "MEDIUM RISK",
          simulatedScore: 52,
          cpuUsage: 58,
          attackRisk: 1,
          integrityStatus: "VERIFIED",
          timestamp: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function randomBetween(min, max) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function readRange(input, fallback) {
  if (Array.isArray(input) && input.length === 2) return [Number(input[0]), Number(input[1])];
  if (input && typeof input === "object" && input.min !== undefined && input.max !== undefined) {
    return [Number(input.min), Number(input.max)];
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deriveRiskLevelFromScore(score) {
  if (score <= 30) return "HIGH RISK";
  if (score <= 60) return "MEDIUM RISK";
  return "LOW RISK";
}

function calculateSimulatedSecurityScore(params) {
  // Higher penalties and signals should reduce score.
  const base =
    100 -
    params.cpuUsage * 0.25 -
    params.attackRisk * 18 -
    params.integrityPenalty * 12 -
    params.anomalyScore * 0.35 -
    params.authFailRate * 2 -
    params.threatSignal * 0.3;
  return Math.round(clamp(base, 0, 100));
}

function readSecurityState() {
  ensureStateFile();
  return JSON.parse(fs.readFileSync(securityStatePath, "utf8"));
}

function writeSecurityState(state) {
  fs.writeFileSync(securityStatePath, JSON.stringify(state, null, 2), "utf8");
}

function buildStateFromLevel(level, incomingRanges = {}) {
  const normalized = (level || "medium").toLowerCase();
  const profile = LEVEL_MAP[normalized] || LEVEL_MAP.medium;
  const activeRanges = {
    cpu_usage: readRange(incomingRanges.cpu_usage, profile.cpu_usage),
    attack_risk: readRange(incomingRanges.attack_risk, profile.attack_risk),
    integrity_penalty: readRange(incomingRanges.integrity_penalty, profile.integrity_penalty),
    anomaly_score: readRange(incomingRanges.anomaly_score, profile.anomaly_score),
    auth_fail_rate: readRange(incomingRanges.auth_fail_rate, profile.auth_fail_rate),
    threat_signal: readRange(incomingRanges.threat_signal, profile.threat_signal)
  };
  const sampled = {
    cpuUsage: randomBetween(activeRanges.cpu_usage[0], activeRanges.cpu_usage[1]),
    attackRisk: randomBetween(activeRanges.attack_risk[0], activeRanges.attack_risk[1]),
    integrityPenalty: randomBetween(
      activeRanges.integrity_penalty[0],
      activeRanges.integrity_penalty[1]
    ),
    anomalyScore: randomBetween(activeRanges.anomaly_score[0], activeRanges.anomaly_score[1]),
    authFailRate: randomBetween(activeRanges.auth_fail_rate[0], activeRanges.auth_fail_rate[1]),
    threatSignal: randomBetween(activeRanges.threat_signal[0], activeRanges.threat_signal[1])
  };
  const simulatedScore = calculateSimulatedSecurityScore(sampled);
  const riskLevel = deriveRiskLevelFromScore(simulatedScore);

  return {
    level: normalized,
    riskLevel,
    simulatedScore,
    cpuUsage: sampled.cpuUsage,
    attackRisk: sampled.attackRisk,
    integrityStatus: "VERIFIED",
    security_params: sampled,
    activeRanges,
    timestamp: new Date().toISOString()
  };
}

module.exports = { readSecurityState, writeSecurityState, buildStateFromLevel, securityStatePath };
