const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const { readNetworkState, statePath } = require("../services/networkMonitor");
const { selectAlgorithm } = require("../services/algorithmSelector");

function executeSimulation(mode) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "..", "simulation", `${mode}.py`);
    const pythonBin = process.env.PYTHON_BIN || "python3";
    const processRef = spawn(pythonBin, [scriptPath, statePath]);

    let stderr = "";
    processRef.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    processRef.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || "Simulation failed."));
      }
      try {
        const state = readNetworkState();
        return resolve(state);
      } catch (error) {
        return reject(error);
      }
    });
  });
}

async function simulateNetwork(req, res) {
  try {
    const { mode } = req.params;
    if (!["normal", "moderate", "slow"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode." });
    }
    const state = await executeSimulation(mode);
    const algorithm = selectAlgorithm(state);
    const io = req.app.get("io");
    if (io) {
      io.emit("network_update", state);
      io.emit("algorithm_update", { currentAlgorithm: algorithm, previousAlgorithm: algorithm });
    }
    return res.json({
      message: `Network mode changed to ${mode}`,
      algorithm,
      state
    });
  } catch (error) {
    return res.status(500).json({ message: "Network simulation failed.", error: error.message });
  }
}

function getNetworkState(req, res) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return res.json({ state });
  } catch (error) {
    return res.status(500).json({ message: "Unable to read network state.", error: error.message });
  }
}

module.exports = { simulateNetwork, getNetworkState, executeSimulation };
