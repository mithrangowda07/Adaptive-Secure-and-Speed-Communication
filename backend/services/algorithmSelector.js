function calculateQosScore(state) {
  const latencyScore = Math.max(0, 100 - state.latency / 4);
  const bandwidthScore = Math.min(100, state.bandwidth * 2);
  const lossScore = Math.max(0, 100 - state.packet_loss * 12);
  const jitterScore = Math.max(0, 100 - state.jitter * 2);
  const throughputScore = Math.min(100, state.throughput * 1.8);
  const stabilityScore = Math.max(0, Math.min(100, state.connection_stability));
  const responseScore = Math.max(0, 100 - state.response_time / 5);
  const errorScore = Math.max(0, 100 - state.error_rate * 10);

  const score =
    latencyScore * 0.18 +
    bandwidthScore * 0.17 +
    lossScore * 0.15 +
    jitterScore * 0.1 +
    throughputScore * 0.12 +
    stabilityScore * 0.13 +
    responseScore * 0.1 +
    errorScore * 0.05;
  return Number(score.toFixed(2));
}

function deriveQosStatus(qosScore) {
  if (qosScore >= 90) return "Excellent";
  if (qosScore >= 75) return "Good";
  if (qosScore >= 60) return "Moderate";
  if (qosScore >= 40) return "Weak";
  return "Poor";
}

function selectAlgorithm(state) {
  if (state.latency <= 50 && state.bandwidth >= 20 && state.packet_loss <= 1) {
    return "ECC";
  }
  if (state.latency <= 150 && state.bandwidth >= 5 && state.packet_loss <= 3) {
    return "AES + RSA";
  }
  return "AES";
}

module.exports = { calculateQosScore, deriveQosStatus, selectAlgorithm };
