const crypto = require("crypto");

function generateHash(data) {
  const normalized = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function verifyHash(originalHash, incomingData) {
  const newHash = generateHash(incomingData);
  return newHash === originalHash ? "VERIFIED" : "FAILED";
}

module.exports = { generateHash, verifyHash };
