function calculateQosScore(state) {
  const latencyScore = Math.max(0, 100 - state.latency);
  const bandwidthScore = Math.min(100, state.bandwidth * 2);
  const lossScore = Math.max(0, 100 - state.packet_loss * 15);
  return (latencyScore * 0.4 + bandwidthScore * 0.4 + lossScore * 0.2).toFixed(2);
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

module.exports = { calculateQosScore, selectAlgorithm };
