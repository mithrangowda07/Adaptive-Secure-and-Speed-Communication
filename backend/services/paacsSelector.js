const db = require("../database/db");

// Keep state in memory to preserve history across calls
let lastRecommended = null;
let consecutiveCount = 0;
let currentActiveAlgorithm = "ECC"; // start with ECC
let freezeCount = 0;

const ALGORITHMS = ["AES-128", "ChaCha20", "AES-256", "AES-256 + RSA", "ECC"];
const TARGET_TRANSFER_TIME = 250;

function selectAlgorithmPAACS(networkQualityScore) {
  // 1. Fetch rolling window of last 10 messages from db (messages only, exclude file transfers)
  const recentMessages = db.prepare(`
    SELECT transfer_time_ms 
    FROM messages 
    WHERE file_name IS NULL AND (file_size IS NULL OR file_size = 0) 
    ORDER BY id DESC 
    LIMIT 10
  `).all();

  const count = recentMessages.length;
  let averageTransferTime = TARGET_TRANSFER_TIME;
  let stdDev = 0;

  if (count > 0) {
    const transferTimes = recentMessages.map(m => Number(m.transfer_time_ms || 0));
    const sum = transferTimes.reduce((acc, v) => acc + v, 0);
    averageTransferTime = sum / count;

    const variance = transferTimes.reduce((acc, v) => acc + Math.pow(v - averageTransferTime, 2), 0) / count;
    stdDev = Math.sqrt(variance);
  }

  // 2. Base Algorithm Selection from network quality
  let baseAlgorithm = "AES-128";
  if (networkQualityScore >= 90) baseAlgorithm = "ECC";
  else if (networkQualityScore >= 75) baseAlgorithm = "AES-256 + RSA";
  else if (networkQualityScore >= 60) baseAlgorithm = "AES-256";
  else if (networkQualityScore >= 40) baseAlgorithm = "ChaCha20";

  // 3. Transfer Time Correction Engine
  let recommendedAlgorithm = baseAlgorithm;
  const index = ALGORITHMS.indexOf(baseAlgorithm);
  let correctionReason = "";

  if (averageTransferTime > 300) {
    if (index > 0) {
      recommendedAlgorithm = ALGORITHMS[index - 1];
      correctionReason = ` (High latency correction: downgraded from ${baseAlgorithm})`;
    } else {
      correctionReason = ` (High latency: already at minimum AES-128)`;
    }
  } else if (averageTransferTime < 200) {
    if (index < ALGORITHMS.length - 1) {
      recommendedAlgorithm = ALGORITHMS[index + 1];
      correctionReason = ` (Low latency correction: upgraded from ${baseAlgorithm})`;
    } else {
      correctionReason = ` (Low latency: already at maximum ECC)`;
    }
  }

  // 4. Stability Controller (freeze changes for the next 5 messages if stdDev > 30 ms)
  let isFrozen = false;
  if (stdDev > 30 && freezeCount === 0) {
    freezeCount = 5;
  }

  if (freezeCount > 0) {
    isFrozen = true;
    freezeCount -= 1;
    // Freeze: keep the current active algorithm
    recommendedAlgorithm = currentActiveAlgorithm;
  } else {
    // 5. Hysteresis (3 consecutive evaluations)
    if (recommendedAlgorithm !== currentActiveAlgorithm) {
      if (recommendedAlgorithm === lastRecommended) {
        consecutiveCount += 1;
      } else {
        lastRecommended = recommendedAlgorithm;
        consecutiveCount = 1;
      }

      if (consecutiveCount >= 3) {
        currentActiveAlgorithm = recommendedAlgorithm;
        consecutiveCount = 0;
      }
    } else {
      lastRecommended = recommendedAlgorithm;
      consecutiveCount = 0;
    }
  }

  const stabilityScore = Math.max(0, Number((100 - stdDev * 2).toFixed(2)));

  // Generate detailed reason text
  let rating = "Poor";
  if (networkQualityScore >= 90) rating = "Excellent";
  else if (networkQualityScore >= 75) rating = "Good";
  else if (networkQualityScore >= 60) rating = "Moderate";
  else if (networkQualityScore >= 40) rating = "Weak";

  let reason = `Network is ${rating} (${networkQualityScore} Quality Score).`;
  if (isFrozen) {
    reason += ` Stability lock active (Std Dev ${stdDev.toFixed(1)} ms > 30 ms): algorithm frozen (remaining messages: ${freezeCount + 1}).`;
  } else if (currentActiveAlgorithm !== baseAlgorithm) {
    reason += `${correctionReason}.`;
  } else {
    reason += ` Algorithm is stable.`;
  }

  return {
    selectedAlgorithm: currentActiveAlgorithm,
    reason,
    averageTransferTime: Number(averageTransferTime.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    stabilityScore,
    isFrozen
  };
}

module.exports = { selectAlgorithmPAACS };
