const fs = require("fs");
const path = require("path");
const { calculateQosScore, deriveQosStatus } = require("./algorithmSelector");
const { selectAlgorithmPAACS } = require("./paacsSelector");

const statePath = path.join(__dirname, "..", "network_state.json");

function readNetworkState() {
  const content = fs.readFileSync(statePath, "utf8");
  const parsed = JSON.parse(content);
  const normalized = {
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
    network_quality_score: qosScore,
    qos_score: qosScore,
    qos_status: deriveQosStatus(qosScore)
  };
}

function resolveAlgorithmState(previousAlgorithm, context = {}) {
  const network = readNetworkState();
  const decision = selectAlgorithmPAACS(network.network_quality_score);

  return {
    network,
    currentAlgorithm: decision.selectedAlgorithm,
    previousAlgorithm: previousAlgorithm || decision.selectedAlgorithm,
    decision
  };
}

module.exports = { readNetworkState, resolveAlgorithmState, statePath };
