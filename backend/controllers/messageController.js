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
    timestamp: now.toISOString(),
    date: now.toISOString().split("T")[0]
  };
}

async function processMessage(payload) {
  const state = resolveAlgorithmState(payload.previousAlgorithm);
  // Encryption benchmark starts before any transport simulation.
  const encStart = performance.now();
  const encrypted = encryptMessage(payload.message, state.currentAlgorithm);
  const encTime = performance.now() - encStart;

  const transferStart = performance.now();
  await new Promise((resolve) => setTimeout(resolve, delayFromLatency(state.network.latency)));
  const transferTime = performance.now() - transferStart;

  const decStart = performance.now();
  const plain = decryptMessage(encrypted, state.currentAlgorithm);
  const decTime = performance.now() - decStart;
  const totalTime = encTime + transferTime + decTime;

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
    network_mode: state.network.mode
  });
  saveCommunication(record);
  return { record, network: state.network, currentAlgorithm: state.currentAlgorithm };
}

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }
    const sender = req.user.username;
    const receiver = req.body.receiver || (sender === "device1" ? "device2" : "device1");
    const state = resolveAlgorithmState();

    const sourceBuffer = fs.readFileSync(req.file.path);
    const encStart = performance.now();
    const encryptedBuffer = encryptBuffer(sourceBuffer, state.currentAlgorithm);
    const encTime = performance.now() - encStart;

    const transferStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, delayFromLatency(state.network.latency)));
    const transferTime = performance.now() - transferStart;

    const decStart = performance.now();
    decryptBuffer(encryptedBuffer, state.currentAlgorithm);
    const decTime = performance.now() - decStart;
    const totalTime = encTime + transferTime + decTime;

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
      network_mode: state.network.mode
    });

    saveCommunication(record);
    req.app.get("io").emit("receive_message", record);
    req.app.get("io").emit("analytics_update", fetchAnalytics(200));
    req.app.get("io").emit("network_update", state.network);
    req.app.get("io").emit("algorithm_update", {
      currentAlgorithm: state.currentAlgorithm
    });

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
