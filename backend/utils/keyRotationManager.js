const crypto = require("crypto");
const forge = require("node-forge");
const db = require("../database/db");

let currentKeyId = 1;
let messageCounter = 0;
let currentAESKey = crypto.randomBytes(32).toString("hex");
let currentRSAKeyPair = crypto.generateKeyPairSync("rsa", {
  modulusLength: 1024,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" }
});
let currentECCKeyPair = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });

const insertKeyEvent = db.prepare(`
  INSERT INTO encryption_keys (key_id, algorithm, created_at, rotation_reason)
  VALUES (@key_id, @algorithm, @created_at, @rotation_reason)
`);

function rotateAllKeys(reason) {
  currentKeyId += 1;
  messageCounter = 0;
  currentAESKey = crypto.randomBytes(32).toString("hex");
  currentRSAKeyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 1024,
    publicKeyEncoding: { type: "pkcs1", format: "pem" },
    privateKeyEncoding: { type: "pkcs1", format: "pem" }
  });
  currentECCKeyPair = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  insertKeyEvent.run({
    key_id: currentKeyId,
    algorithm: "ALL",
    created_at: new Date().toISOString(),
    rotation_reason: reason
  });
  return { keyId: currentKeyId, reason };
}

function useKeyForMessage() {
  messageCounter += 1;
  let rotation = null;
  if (messageCounter >= 5) {
    rotation = rotateAllKeys("Automatic rotation after 5 messages");
  }
  return {
    keyId: currentKeyId,
    rotation,
    aesKey: currentAESKey,
    rsaKeyPair: currentRSAKeyPair,
    eccKeyPair: currentECCKeyPair
  };
}

module.exports = { useKeyForMessage };
