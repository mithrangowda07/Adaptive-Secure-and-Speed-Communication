const { processMessage } = require("../controllers/messageController");
const { fetchAnalytics } = require("../services/analyticsService");
const { resolveAlgorithmState } = require("../services/networkMonitor");
const { executeSimulation } = require("../controllers/networkController");
const { performance } = require("perf_hooks");
const { encryptBuffer, decryptBuffer } = require("../services/encryptionService");
const { saveCommunication } = require("../services/analyticsService");
const { generateHash, verifyHash } = require("../utils/integrityManager");
const { calculateSecurityScore } = require("../utils/securityScore");
const { useKeyForMessage } = require("../utils/keyRotationManager");

function registerSocketHandlers(io) {
  // Tracks algorithm transitions for the right-side live status panel.
  let previousAlgorithm = null;

  // Initialize and run the continuous smooth network quality evolution simulation
  const { initSimulation } = require("../controllers/networkController");
  initSimulation(io);

  io.on("connection", (socket) => {
    socket.on("send_message", async (payload) => {
      try {
        // Message pipeline: encrypt -> synthetic transfer delay -> decrypt -> persist.
        const result = await processMessage({ ...payload, previousAlgorithm });
        const previous = previousAlgorithm || result.currentAlgorithm;
        previousAlgorithm = result.currentAlgorithm;

        io.emit("receive_message", result.record);
        io.emit("network_update", result.network);
        io.emit("algorithm_update", {
          currentAlgorithm: result.currentAlgorithm,
          previousAlgorithm: previous
        });
        io.emit("analytics_update", fetchAnalytics(200));
        io.emit("security_update", result.security);
        if (result.record.integrity_status === "FAILED") {
          io.emit("integrity_alert", {
            message: "WARNING: Message Integrity Compromised",
            timestamp: result.record.timestamp
          });
        }
        if (result.keyRotation) {
          io.emit("key_rotation", result.keyRotation);
        }
      } catch (error) {
        socket.emit("server_error", { message: "Message processing failed.", error: error.message });
      }
    });

    socket.on("request_network_change", async ({ mode }) => {
      try {
        const simulation = await executeSimulation(mode);
        const state = simulation.state || simulation;
        const algorithmInfo = resolveAlgorithmState(previousAlgorithm);
        const previous = previousAlgorithm || algorithmInfo.currentAlgorithm;
        previousAlgorithm = algorithmInfo.currentAlgorithm;

        io.emit("network_update", state);
        io.emit("algorithm_update", {
          currentAlgorithm: algorithmInfo.currentAlgorithm,
          previousAlgorithm: previous
        });
      } catch (error) {
        socket.emit("server_error", { message: "Network update failed.", error: error.message });
      }
    });

    socket.on("upload_file", async (payload) => {
      try {
        const algorithmInfo = resolveAlgorithmState(previousAlgorithm);
        const keyMaterial = useKeyForMessage();
        const sourceBuffer = Buffer.from(payload.fileContentBase64, "base64");
        const encStart = performance.now();
        const encryptedBuffer = encryptBuffer(sourceBuffer, algorithmInfo.currentAlgorithm, keyMaterial);
        const encTime = performance.now() - encStart;
        const messageHash = generateHash(encryptedBuffer.toString("utf8"));
        const integrityStatus = verifyHash(messageHash, encryptedBuffer.toString("utf8"));

        const transferStart = performance.now();
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(30, algorithmInfo.network.latency * 4))
        );
        const transferTime = performance.now() - transferStart;

        const decStart = performance.now();
        decryptBuffer(encryptedBuffer, algorithmInfo.currentAlgorithm, keyMaterial);
        const decTime = performance.now() - decStart;
        const now = new Date();
        const cpuUsage = Number((30 + Math.random() * 60).toFixed(2));
        const security = calculateSecurityScore({
          algorithm: algorithmInfo.currentAlgorithm,
          keySize: 256,
          packetLoss: algorithmInfo.network.packet_loss,
          latency: algorithmInfo.network.latency,
          bandwidth: algorithmInfo.network.bandwidth,
          transferTime,
          cpuUsage,
          riskLevel: algorithmInfo.decision?.riskLevel || "MEDIUM RISK",
          integrityStatus
        });

        const encStr = encryptedBuffer.toString("base64");
        const truncatedCipher = encStr.length > 500 ? encStr.slice(0, 500) + "..." : encStr;
        const record = {
          sender: payload.sender,
          receiver: payload.receiver,
          message: null,
          file_name: payload.fileName,
          file_size: payload.fileSize,
          encryption_algorithm: algorithmInfo.currentAlgorithm,
          encryption_time_ms: Number(encTime.toFixed(3)),
          transfer_time_ms: Number(transferTime.toFixed(3)),
          decryption_time_ms: Number(decTime.toFixed(3)),
          total_processing_time_ms: Number((encTime + transferTime + decTime).toFixed(3)),
          latency_ms: algorithmInfo.network.latency,
          bandwidth_mbps: algorithmInfo.network.bandwidth,
          packet_loss_percent: algorithmInfo.network.packet_loss,
          network_mode: algorithmInfo.network.mode,
          message_hash: messageHash,
          integrity_status: integrityStatus,
          key_id: keyMaterial.keyId,
          security_score: security.securityScore,
          risk_level: security.riskLevel,
          cpu_usage: cpuUsage,
          attack_risk: 0,
          algorithm_reason: algorithmInfo.decision?.reason || "Balanced security and performance",
          timestamp: now.toISOString(),
          date: now.toISOString().split("T")[0],
          sent_message: `[File: ${payload.fileName} (${payload.fileSize} bytes)]`,
          encrypted_message_sent: truncatedCipher,
          encrypted_message_received: truncatedCipher,
          decrypted_message: `[File Decrypted Successfully]`
        };
        saveCommunication(record);
        io.emit("receive_message", record);
        io.emit("analytics_update", fetchAnalytics(200));
        io.emit("security_update", {
          securityScore: record.security_score,
          riskLevel: record.risk_level,
          integrityStatus: record.integrity_status,
          keyId: record.key_id,
          algorithmReason: record.algorithm_reason,
          performanceLevel: algorithmInfo.decision?.performanceLevel || "MODERATE"
        });
      } catch (error) {
        socket.emit("server_error", { message: "File processing failed.", error: error.message });
      }
    });
  });
}

module.exports = registerSocketHandlers;
