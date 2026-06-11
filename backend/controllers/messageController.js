const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const multer = require("multer");
const {
  encryptMessage,
  decryptMessage,
  encryptBuffer,
  decryptBuffer
} = require("../services/encryptionService");
const { saveCommunication, fetchAnalytics } = require("../services/analyticsService");
const { resolveAlgorithmState } = require("../services/networkMonitor");
const { generateHash, verifyHash } = require("../utils/integrityManager");
const { useKeyForMessage } = require("../utils/keyRotationManager");
const { consumeTamperMode } = require("../utils/tamperManager");

const uploadPath = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

function buildRecord(data) {
  const now = new Date();
  return {
    sender: data.sender,
    receiver: data.receiver,
    message: data.message || null,
    file_name: data.file_name || null,
    file_size: data.file_size || null,
    encryption_algorithm: data.encryption_algorithm,
    encryption_time_ms: data.encryption_time_ms,
    transfer_time_ms: data.transfer_time_ms,
    decryption_time_ms: data.decryption_time_ms,
    total_processing_time_ms: data.total_processing_time_ms,
    latency_ms: data.latency_ms,
    bandwidth_mbps: data.bandwidth_mbps,
    packet_loss_percent: data.packet_loss_percent,
    network_mode: data.network_mode || "Good",
    network_quality_score: data.network_quality_score ?? 80,
    stability_score: data.stability_score ?? 80,
    transfer_std_deviation: data.transfer_std_deviation ?? 0,
    message_hash: data.message_hash,
    integrity_status: data.integrity_status,
    key_id: data.key_id,
    security_score: data.security_score,
    risk_level: data.risk_level,
    cpu_usage: data.cpu_usage,
    attack_risk: data.attack_risk,
    algorithm_reason: data.algorithm_reason,
    timestamp: now.toISOString(),
    date: now.toISOString().split("T")[0],
    sent_message: data.sent_message || null,
    encrypted_message_sent: data.encrypted_message_sent || null,
    encrypted_message_received: data.encrypted_message_received || null,
    decrypted_message: data.decrypted_message || null
  };
}

async function processMessage(payload) {
  const state = resolveAlgorithmState(payload.previousAlgorithm);
  const keyMaterial = useKeyForMessage();

  const encStart = performance.now();
  const encrypted = encryptMessage(payload.message, state.currentAlgorithm, keyMaterial);
  const encTime = performance.now() - encStart;
  const messageHash = generateHash(encrypted);

  let incomingPayload = encrypted;
  const tampered = consumeTamperMode();
  if (tampered && typeof incomingPayload === "string" && incomingPayload.length > 6) {
    const flipIndex = Math.floor(incomingPayload.length / 2);
    incomingPayload =
      incomingPayload.slice(0, flipIndex) +
      (incomingPayload[flipIndex] === "A" ? "B" : "A") +
      incomingPayload.slice(flipIndex + 1);
  }

  // Simulate delay to keep transfer times close to 250 ms target
  const Q = state.network.network_quality_score;
  const baseNetworkDelay = 250 - (Q - 50) * 2;
  
  let algoOverhead = 0;
  if (state.currentAlgorithm === "ECC") algoOverhead = 60;
  else if (state.currentAlgorithm === "AES-256 + RSA") algoOverhead = 30;
  else if (state.currentAlgorithm === "AES-256") algoOverhead = 0;
  else if (state.currentAlgorithm === "ChaCha20") algoOverhead = -30;
  else if (state.currentAlgorithm === "AES-128") algoOverhead = -60;
  
  const noise = Math.floor(Math.random() * 17) - 8;
  const simulatedDelay = Math.max(10, baseNetworkDelay + algoOverhead + noise);

  const transferStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
  const transferTime = performance.now() - transferStart;

  const integrityStatus = verifyHash(messageHash, incomingPayload);
  const decStart = performance.now();
  const plain =
    integrityStatus === "VERIFIED"
      ? decryptMessage(incomingPayload, state.currentAlgorithm, keyMaterial)
      : "[INTEGRITY_CHECK_FAILED]";
  const decTime = performance.now() - decStart;
  const totalTime = encTime + transferTime + decTime;

  // Mock score & risk ratings based on stability for compatibility
  const algoStrength = {
    "ECC": 95,
    "AES-256 + RSA": 85,
    "AES-256": 75,
    "ChaCha20": 60,
    "AES-128": 45
  };
  const securityScore = algoStrength[state.currentAlgorithm] || 70;
  const riskLevel = state.decision.stdDev <= 5 ? "EXCELLENT STABILITY" :
                    state.decision.stdDev <= 15 ? "GOOD STABILITY" :
                    state.decision.stdDev <= 30 ? "MODERATE STABILITY" : "POOR STABILITY";

  const record = buildRecord({
    sender: payload.sender,
    receiver: payload.receiver,
    message: plain,
    encryption_algorithm: state.currentAlgorithm,
    encryption_time_ms: Number(encTime.toFixed(3)),
    transfer_time_ms: Number(transferTime.toFixed(3)),
    decryption_time_ms: Number(decTime.toFixed(3)),
    total_processing_time_ms: Number(totalTime.toFixed(3)),
    latency_ms: state.network.latency,
    bandwidth_mbps: state.network.bandwidth,
    packet_loss_percent: state.network.packet_loss,
    network_mode: state.network.qos_status,
    network_quality_score: Q,
    stability_score: state.decision.stabilityScore,
    transfer_std_deviation: state.decision.stdDev,
    message_hash: messageHash,
    integrity_status: integrityStatus,
    key_id: keyMaterial.keyId,
    security_score: securityScore,
    risk_level: riskLevel,
    cpu_usage: 35 + Math.random() * 20,
    attack_risk: integrityStatus === "FAILED" ? 3 : 0,
    algorithm_reason: state.decision.reason,
    sent_message: payload.message,
    encrypted_message_sent: encrypted,
    encrypted_message_received: incomingPayload,
    decrypted_message: plain
  });
  
  saveCommunication(record);
  return {
    record,
    network: state.network,
    currentAlgorithm: state.currentAlgorithm,
    security: {
      securityScore: securityScore,
      riskLevel: riskLevel,
      integrityStatus,
      keyId: keyMaterial.keyId,
      algorithmReason: state.decision.reason,
      performanceLevel: state.network.qos_status
    },
    keyRotation: keyMaterial.rotation
  };
}

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }
    const sender = req.user.username;
    const receiver = req.body.receiver || (sender === "device1" ? "device2" : "device1");
    const state = resolveAlgorithmState(null);
    const keyMaterial = useKeyForMessage();

    const sourceBuffer = fs.readFileSync(req.file.path);
    const encStart = performance.now();
    const encryptedBuffer = encryptBuffer(sourceBuffer, state.currentAlgorithm, keyMaterial);
    const encTime = performance.now() - encStart;
    const messageHash = generateHash(encryptedBuffer.toString("utf8"));
    const integrityStatus = verifyHash(messageHash, encryptedBuffer.toString("utf8"));

    // Simulate transfer time with file size overhead
    const Q = state.network.network_quality_score;
    const baseNetworkDelay = 250 - (Q - 50) * 2;
    
    let algoOverhead = 0;
    if (state.currentAlgorithm === "ECC") algoOverhead = 60;
    else if (state.currentAlgorithm === "AES-256 + RSA") algoOverhead = 30;
    else if (state.currentAlgorithm === "AES-256") algoOverhead = 0;
    else if (state.currentAlgorithm === "ChaCha20") algoOverhead = -30;
    else if (state.currentAlgorithm === "AES-128") algoOverhead = -60;
    
    const noise = Math.floor(Math.random() * 17) - 8;
    const fileSizeMb = req.file.size / (1024 * 1024);
    const fileSizeOverhead = fileSizeMb * 100;
    const simulatedDelay = Math.max(10, baseNetworkDelay + algoOverhead + noise + fileSizeOverhead);

    const transferStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
    const transferTime = performance.now() - transferStart;

    const decStart = performance.now();
    decryptBuffer(encryptedBuffer, state.currentAlgorithm, keyMaterial);
    const decTime = performance.now() - decStart;
    const totalTime = encTime + transferTime + decTime;

    const algoStrength = {
      "ECC": 95,
      "AES-256 + RSA": 85,
      "AES-256": 75,
      "ChaCha20": 60,
      "AES-128": 45
    };
    const securityScore = algoStrength[state.currentAlgorithm] || 70;
    const riskLevel = state.decision.stdDev <= 5 ? "EXCELLENT STABILITY" :
                      state.decision.stdDev <= 15 ? "GOOD STABILITY" :
                      state.decision.stdDev <= 30 ? "MODERATE STABILITY" : "POOR STABILITY";

    const record = buildRecord({
      sender,
      receiver,
      file_name: req.file.originalname,
      file_size: req.file.size,
      encryption_algorithm: state.currentAlgorithm,
      encryption_time_ms: Number(encTime.toFixed(3)),
      transfer_time_ms: Number(transferTime.toFixed(3)),
      decryption_time_ms: Number(decTime.toFixed(3)),
      total_processing_time_ms: Number(totalTime.toFixed(3)),
      latency_ms: state.network.latency,
      bandwidth_mbps: state.network.bandwidth,
      packet_loss_percent: state.network.packet_loss,
      network_mode: state.network.qos_status,
      network_quality_score: Q,
      stability_score: state.decision.stabilityScore,
      transfer_std_deviation: state.decision.stdDev,
      message_hash: messageHash,
      integrity_status: integrityStatus,
      key_id: keyMaterial.keyId,
      security_score: securityScore,
      risk_level: riskLevel,
      cpu_usage: 35 + Math.random() * 20,
      attack_risk: 0,
      algorithm_reason: state.decision.reason,
      sent_message: `[File: ${req.file.originalname} (${req.file.size} bytes)]`,
      encrypted_message_sent: encryptedBuffer.toString("base64"),
      encrypted_message_received: encryptedBuffer.toString("base64"),
      decrypted_message: `[File Decrypted Successfully]`
    });

    saveCommunication(record);
    
    const io = req.app.get("io");
    io.emit("receive_message", record);
    io.emit("analytics_update", fetchAnalytics(200));
    io.emit("network_update", state.network);
    io.emit("algorithm_update", {
      currentAlgorithm: state.currentAlgorithm
    });
    io.emit("security_update", {
      securityScore: securityScore,
      riskLevel: riskLevel,
      integrityStatus,
      keyId: keyMaterial.keyId,
      algorithmReason: state.decision.reason,
      performanceLevel: state.network.qos_status
    });
    if (keyMaterial.rotation) {
      io.emit("key_rotation", keyMaterial.rotation);
    }

    return res.json({
      message: "File uploaded successfully.",
      file: {
        name: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${path.basename(req.file.path)}`
      },
      analytics: record,
      currentAlgorithm: state.currentAlgorithm,
      network: state.network
    });
  } catch (error) {
    return res.status(500).json({ message: "File upload failed.", error: error.message });
  }
}

module.exports = { upload, uploadFile, processMessage };
