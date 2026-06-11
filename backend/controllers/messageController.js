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
const { calculateSecurityScore } = require("../utils/securityScore");
const { consumeTamperMode } = require("../utils/tamperManager");
const { readSecurityState } = require("../utils/securitySimulationState");
let integrityFailureCount = 0;

const uploadPath = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

function delayFromLatency(latency) {
  // Scale synthetic network delay from simulated latency.
  return Math.max(30, latency * 4);
}

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
    network_mode: data.network_mode,
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
  const securityState = readSecurityState();
  const cpuUsage = securityState.cpuUsage;
  const state = resolveAlgorithmState(payload.previousAlgorithm, {
    messageSize: (payload.message || "").length,
    fileSize: 0,
    cpuUsage,
    attackRisk: Math.max(Math.min(3, integrityFailureCount), securityState.attackRisk || 0),
    integrityStatus: "VERIFIED",
    retryCount: 0,
    riskLevel: securityState.riskLevel
  });
  const keyMaterial = useKeyForMessage();

  // Encryption benchmark starts before any transport simulation.
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

  const transferStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, delayFromLatency(state.network.latency)));
  const transferTime = performance.now() - transferStart;

  const integrityStatus = verifyHash(messageHash, incomingPayload);
  const decStart = performance.now();
  const plain =
    integrityStatus === "VERIFIED"
      ? decryptMessage(incomingPayload, state.currentAlgorithm, keyMaterial)
      : "[INTEGRITY_CHECK_FAILED]";
  const decTime = performance.now() - decStart;
  const totalTime = encTime + transferTime + decTime;
  const attackRisk = integrityStatus === "FAILED" ? 3 : 0;
  if (integrityStatus === "FAILED") {
    integrityFailureCount += 1;
  } else if (integrityFailureCount > 0) {
    integrityFailureCount -= 1;
  }
  const security = calculateSecurityScore({
    algorithm: state.currentAlgorithm,
    keySize: state.currentAlgorithm === "ECC" ? 256 : 256,
    packetLoss: state.network.packet_loss,
    latency: state.network.latency,
    bandwidth: state.network.bandwidth,
    transferTime,
    cpuUsage,
    riskLevel: state.decision.riskLevel,
    integrityStatus
  });

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
    network_mode: state.network.mode,
    message_hash: messageHash,
    integrity_status: integrityStatus,
    key_id: keyMaterial.keyId,
    security_score: security.securityScore,
    risk_level: security.riskLevel,
    cpu_usage: cpuUsage,
    attack_risk: attackRisk,
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
      securityScore: security.securityScore,
      riskLevel: security.riskLevel,
      integrityStatus,
      keyId: keyMaterial.keyId,
      algorithmReason: state.decision.reason,
      performanceLevel: state.decision.performanceLevel
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
    const securityState = readSecurityState();
    const cpuUsage = securityState.cpuUsage;
    const state = resolveAlgorithmState(null, {
      messageSize: 0,
      fileSize: req.file.size / (1024 * 1024),
      cpuUsage,
      attackRisk: Math.max(Math.min(3, integrityFailureCount), securityState.attackRisk || 0),
      integrityStatus: "VERIFIED",
      retryCount: 0,
      riskLevel: securityState.riskLevel
    });
    const keyMaterial = useKeyForMessage();

    const sourceBuffer = fs.readFileSync(req.file.path);
    const encStart = performance.now();
    const encryptedBuffer = encryptBuffer(sourceBuffer, state.currentAlgorithm, keyMaterial);
    const encTime = performance.now() - encStart;
    const messageHash = generateHash(encryptedBuffer.toString("utf8"));
    const integrityStatus = verifyHash(messageHash, encryptedBuffer.toString("utf8"));

    const transferStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, delayFromLatency(state.network.latency)));
    const transferTime = performance.now() - transferStart;

    const decStart = performance.now();
    decryptBuffer(encryptedBuffer, state.currentAlgorithm, keyMaterial);
    const decTime = performance.now() - decStart;
    const totalTime = encTime + transferTime + decTime;
    const attackRisk = 0;
    const security = calculateSecurityScore({
      algorithm: state.currentAlgorithm,
      keySize: state.currentAlgorithm === "ECC" ? 256 : 256,
      packetLoss: state.network.packet_loss,
      latency: state.network.latency,
      bandwidth: state.network.bandwidth,
      transferTime,
      cpuUsage,
      riskLevel: state.decision.riskLevel,
      integrityStatus
    });

    const encStr = encryptedBuffer.toString("base64");
    const truncatedCipher = encStr.length > 500 ? encStr.slice(0, 500) + "..." : encStr;
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
      network_mode: state.network.mode,
      message_hash: messageHash,
      integrity_status: integrityStatus,
      key_id: keyMaterial.keyId,
      security_score: security.securityScore,
      risk_level: security.riskLevel,
      cpu_usage: cpuUsage,
      attack_risk: attackRisk,
      algorithm_reason: state.decision.reason,
      sent_message: `[File: ${req.file.originalname} (${req.file.size} bytes)]`,
      encrypted_message_sent: truncatedCipher,
      encrypted_message_received: truncatedCipher,
      decrypted_message: `[File Decrypted Successfully]`
    });

    saveCommunication(record);
    req.app.get("io").emit("receive_message", record);
    req.app.get("io").emit("analytics_update", fetchAnalytics(200));
    req.app.get("io").emit("network_update", state.network);
    req.app.get("io").emit("algorithm_update", {
      currentAlgorithm: state.currentAlgorithm
    });
    req.app.get("io").emit("security_update", {
      securityScore: security.securityScore,
      riskLevel: security.riskLevel,
      integrityStatus,
      keyId: keyMaterial.keyId,
      algorithmReason: state.decision.reason,
      performanceLevel: state.decision.performanceLevel
    });
    if (keyMaterial.rotation) {
      req.app.get("io").emit("key_rotation", keyMaterial.rotation);
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
