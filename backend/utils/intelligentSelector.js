function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function intelligentAlgorithmSelection({
  networkMode,
  configuredRiskLevel,
  latency,
  bandwidth,
  packetLoss,
  cpuUsage,
  messageSize,
  fileSize,
  retryCount,
  attackRisk,
  integrityStatus
}) {
  let securityRiskScore =
    packetLoss * 5 +
    latency / 10 +
    cpuUsage * 0.3 +
    attackRisk * 20 +
    retryCount * 10;
  securityRiskScore = clamp(securityRiskScore, 0, 100);

  const derivedRiskLevel =
    securityRiskScore <= 30 ? "LOW RISK" : securityRiskScore <= 60 ? "MEDIUM RISK" : "HIGH RISK";
  const riskLevel = configuredRiskLevel || derivedRiskLevel;

  let performanceScore = bandwidth * 2 - latency / 5 - packetLoss * 5 - cpuUsage * 0.2;
  performanceScore = clamp(performanceScore, 0, 100);
  const performanceLevel =
    performanceScore >= 70 ? "GOOD" : performanceScore >= 40 ? "MODERATE" : "POOR";

  const complexityScore = messageSize + fileSize * 10;
  const complexityLevel =
    complexityScore <= 20 ? "LIGHT" : complexityScore <= 60 ? "MEDIUM" : "HEAVY";

  let selectedAlgorithm = "ECC";
  let reason = "Selected by policy";

  if (networkMode === "normal") {
    if (riskLevel === "HIGH RISK" || riskLevel === "MEDIUM RISK") {
      selectedAlgorithm = "ECC";
      reason = "Normal network with medium/high security risk";
    } else {
      selectedAlgorithm = "AES + RSA";
      reason = "Normal network with low security risk";
    }
  } else if (networkMode === "moderate") {
    if (riskLevel === "HIGH RISK") {
      selectedAlgorithm = "ECC";
      reason = "Moderate network with high security risk";
    } else if (riskLevel === "MEDIUM RISK") {
      selectedAlgorithm = "AES + RSA";
      reason = "Moderate network with medium security risk";
    } else {
      selectedAlgorithm = "AES";
      reason = "Moderate network with low security risk";
    }
  } else if (networkMode === "slow") {
    if (riskLevel === "HIGH RISK") {
      selectedAlgorithm = "AES + RSA";
      reason = "Slow network with high security risk";
    } else {
      selectedAlgorithm = "AES";
      reason = "Slow network with low/medium risk needs lightweight crypto";
    }
  } else if (integrityStatus === "FAILED" || attackRisk >= 2) {
    selectedAlgorithm = "ECC";
    reason = "Packet tampering or attack detected";
  }

  return {
    selectedAlgorithm,
    reason,
    riskLevel,
    securityRiskScore: Number(securityRiskScore.toFixed(2)),
    performanceLevel
  };
}

module.exports = { intelligentAlgorithmSelection };
