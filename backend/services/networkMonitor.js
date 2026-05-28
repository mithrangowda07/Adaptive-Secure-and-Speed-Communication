const fs = require("fs");
const path = require("path");
const { selectAlgorithm, calculateQosScore } = require("./algorithmSelector");

const statePath = path.join(__dirname, "..", "network_state.json");

function readNetworkState() {
  const content = fs.readFileSync(statePath, "utf8");
  const parsed = JSON.parse(content);
  return { ...parsed, qos_score: Number(calculateQosScore(parsed)) };
}

function resolveAlgorithmState(previousAlgorithm) {
  const network = readNetworkState();
  const currentAlgorithm = selectAlgorithm(network);
  return {
    network,
    currentAlgorithm,
    previousAlgorithm: previousAlgorithm || currentAlgorithm
  };
}

module.exports = { readNetworkState, resolveAlgorithmState, statePath };
