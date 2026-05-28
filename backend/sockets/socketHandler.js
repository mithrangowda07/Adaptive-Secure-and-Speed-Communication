const { processMessage } = require("../controllers/messageController");
const { fetchAnalytics } = require("../services/analyticsService");
const { resolveAlgorithmState } = require("../services/networkMonitor");
const { executeSimulation } = require("../controllers/networkController");
const { performance } = require("perf_hooks");
const { encryptBuffer, decryptBuffer } = require("../services/encryptionService");
const { saveCommunication } = require("../services/analyticsService");

function registerSocketHandlers(io) {
  // Tracks algorithm transitions for the right-side live status panel.
  let previousAlgorithm = null;

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
      } catch (error) {
        socket.emit("server_error", { message: "Message processing failed.", error: error.message });
      }
    });

    socket.on("request_network_change", async ({ mode }) => {
      try {
        const state = await executeSimulation(mode);
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
        const sourceBuffer = Buffer.from(payload.fileContentBase64, "base64");
        const encStart = performance.now();
        const encryptedBuffer = encryptBuffer(sourceBuffer, algorithmInfo.currentAlgorithm);
        const encTime = performance.now() - encStart;

        const transferStart = performance.now();
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(30, algorithmInfo.network.latency * 4))
        );
        const transferTime = performance.now() - transferStart;

        const decStart = performance.now();
        decryptBuffer(encryptedBuffer, algorithmInfo.currentAlgorithm);
        const decTime = performance.now() - decStart;
        const now = new Date();

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
          timestamp: now.toISOString(),
          date: now.toISOString().split("T")[0]
        };
        saveCommunication(record);
        io.emit("receive_message", record);
        io.emit("analytics_update", fetchAnalytics(200));
      } catch (error) {
        socket.emit("server_error", { message: "File processing failed.", error: error.message });
      }
    });
  });
}

module.exports = registerSocketHandlers;
