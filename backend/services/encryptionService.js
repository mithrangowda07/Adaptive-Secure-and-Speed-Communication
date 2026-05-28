const CryptoJS = require("crypto-js");
const forge = require("node-forge");
const crypto = require("crypto");

const SHARED_SECRET = "adaptive-secure-shared-secret";
const RSA = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 0x10001 });

function deriveEccSessionKey() {
  // Simulate ECC secure key agreement, then use derived secret as AES session key.
  const sender = crypto.createECDH("prime256v1");
  sender.generateKeys();
  const receiver = crypto.createECDH("prime256v1");
  receiver.generateKeys();
  const sharedSecret = sender.computeSecret(receiver.getPublicKey());
  return CryptoJS.enc.Hex.parse(sharedSecret.toString("hex"));
}

function encryptMessage(message, algorithm) {
  if (algorithm === "AES") {
    return CryptoJS.AES.encrypt(message, SHARED_SECRET).toString();
  }

  if (algorithm === "AES + RSA") {
    const aesCipher = CryptoJS.AES.encrypt(message, SHARED_SECRET).toString();
    const encryptedKey = forge.util.encode64(
      RSA.publicKey.encrypt(SHARED_SECRET, "RSAES-PKCS1-V1_5")
    );
    return JSON.stringify({ aesCipher, encryptedKey });
  }

  const sessionKey = deriveEccSessionKey();
  const iv = CryptoJS.lib.WordArray.random(16);
  const cipher = CryptoJS.AES.encrypt(message, sessionKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString();
  return JSON.stringify({ cipher, sessionKeyHex: sessionKey.toString(), ivHex: iv.toString() });
}

function decryptMessage(cipherText, algorithm) {
  if (algorithm === "AES") {
    return CryptoJS.AES.decrypt(cipherText, SHARED_SECRET).toString(CryptoJS.enc.Utf8);
  }

  if (algorithm === "AES + RSA") {
    const parsed = JSON.parse(cipherText);
    const decryptedKey = RSA.privateKey.decrypt(
      forge.util.decode64(parsed.encryptedKey),
      "RSAES-PKCS1-V1_5"
    );
    return CryptoJS.AES.decrypt(parsed.aesCipher, decryptedKey).toString(CryptoJS.enc.Utf8);
  }

  const parsed = JSON.parse(cipherText);
  const sessionKey = CryptoJS.enc.Hex.parse(parsed.sessionKeyHex);
  const iv = CryptoJS.enc.Hex.parse(parsed.ivHex);
  return CryptoJS.AES.decrypt(parsed.cipher, sessionKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString(CryptoJS.enc.Utf8);
}

function encryptBuffer(buffer, algorithm) {
  const base = buffer.toString("base64");
  return Buffer.from(encryptMessage(base, algorithm), "utf8");
}

function decryptBuffer(buffer, algorithm) {
  const base = decryptMessage(buffer.toString("utf8"), algorithm);
  return Buffer.from(base, "base64");
}

module.exports = {
  encryptMessage,
  decryptMessage,
  encryptBuffer,
  decryptBuffer
};
