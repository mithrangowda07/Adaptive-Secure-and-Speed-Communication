const { fetchAnalytics } = require("../services/analyticsService");
const { resolveAlgorithmState } = require("../services/networkMonitor");

function fetchAnalyticsController(req, res) {
  try {
    const rows = fetchAnalytics();
    const state = resolveAlgorithmState();
    return res.json({
      currentAlgorithm: state.currentAlgorithm,
      networkMode: state.network.mode,
      rows
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics.", error: error.message });
  }
}

module.exports = { fetchAnalyticsController };
