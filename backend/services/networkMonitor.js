const fs = require("fs");
const path = require("path");
const { selectAlgorithm, calculateQosScore, deriveQosStatus } = require("./algorithmSelector");
const { intelligentAlgorithmSelection } = require("../utils/intelligentSelector");
const { readSecurityState } = require("../utils/securitySimulationState");

const statePath = path.join(__dirname, "..", "network_state.json");

function readNetworkState() {
  const content = fs.readFileSync(statePath, "utf8");
  const parsed = JSON.parse(content);
  const normalized = {
    mode: parsed.mode || "normal",
    latency: Number(parsed.latency ?? 30),
    bandwidth: Number(parsed.bandwidth ?? 35),
    packet_loss: Number(parsed.packet_loss ?? 0.5),
    jitter: Number(parsed.jitter ?? 5),
    throughput: Number(parsed.throughput ?? 30),
    connection_stability: Number(parsed.connection_stability ?? 95),
    response_time: Number(parsed.response_time ?? 45),
    error_rate: Number(parsed.error_rate ?? 0.2)
  };
  const qosScore = calculateQosScore(normalized);
  return {
    ...normalized,
    qos_score: qosScore,
    qos_status: deriveQosStatus(qosScore)
  };
}

function resolveAlgorithmState(previousAlgorithm, context = {}) {
  const network = readNetworkState();
  const securityState = readSecurityState();
  const effectiveRiskLevel = context.riskLevel || securityState.riskLevel;
  const decision = intelligentAlgorithmSelection({
    networkMode: network.mode,
    configuredRiskLevel: effectiveRiskLevel,
    latency: network.latency,
    bandwidth: network.bandwidth,
    packetLoss: network.packet_loss,
    cpuUsage: context.cpuUsage || securityState.cpuUsage || 40,
    messageSize: context.messageSize || 0,
    fileSize: context.fileSize || 0,
    retryCount: context.retryCount || 0,
    attackRisk: context.attackRisk ?? securityState.attackRisk ?? 0,
    integrityStatus: context.integrityStatus || "VERIFIED"
  });
  decision.riskLevel = effectiveRiskLevel;
  const currentAlgorithm = decision.selectedAlgorithm || selectAlgorithm(network);
  return {
    network,
    securityState,
    currentAlgorithm,
    previousAlgorithm: previousAlgorithm || currentAlgorithm,
    decision
  };
}

module.exports = { readNetworkState, resolveAlgorithmState, statePath };
