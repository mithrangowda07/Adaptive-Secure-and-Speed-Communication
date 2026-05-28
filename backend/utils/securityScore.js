function normalize(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateSecurityScore({
  algorithm,
  keySize,
  packetLoss,
  latency,
  bandwidth,
  transferTime,
  cpuUsage,
  riskLevel,
  integrityStatus
}) {
  let score = 0;

  if (algorithm === "AES") score += 25;
  if (algorithm === "AES + RSA") score += 35;
  if (algorithm === "ECC") score += 40;

  if (algorithm === "ECC") {
    score += 25;
  } else if (keySize >= 256) {
    score += 20;
  } else {
    score += 10;
  }

  score += integrityStatus === "VERIFIED" ? 20 : -40;
  score -= packetLoss * 2;
  score -= latency / 10;
  score -= cpuUsage / 5;
  score += Math.max(0, Math.min(6, bandwidth / 8));
  score -= transferTime > 0 ? Math.min(12, transferTime / 160) : 0;

  if (riskLevel === "LOW RISK") score += 20;
  if (riskLevel === "MEDIUM RISK") score += 0;
  if (riskLevel === "HIGH RISK") score -= 20;

  const securityScore = normalize(score);
  const derivedRiskLevel =
    securityScore <= 30 ? "HIGH RISK" : securityScore <= 60 ? "MEDIUM RISK" : "LOW RISK";

  return {
    securityScore,
    riskLevel: derivedRiskLevel,
    reason: `Algorithm=${algorithm}, Integrity=${integrityStatus}, CPU=${cpuUsage.toFixed(1)}`
  };
}

module.exports = { calculateSecurityScore };
