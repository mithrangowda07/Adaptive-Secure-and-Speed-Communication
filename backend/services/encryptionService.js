const CryptoJS = require("crypto-js");
const forge = require("node-forge");
const crypto = require("crypto");

const SHARED_SECRET = "adaptive-secure-shared-secret";
const RSA = crypto.generateKeyPairSync("rsa", {
  modulusLength: 1024,
  publicKeyEncoding: { type: "pkcs1", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" }
});

function encryptMessage(message, algorithm, cryptoContext = {}) {
  const secret = cryptoContext.aesKey || SHARED_SECRET;
  const rsaKeyPair = cryptoContext.rsaKeyPair || RSA;

  if (algorithm === "AES-128") {
    const key = crypto.createHash("md5").update(secret).digest(); // 16 bytes (128 bits)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");
    return JSON.stringify({ cipher: encrypted, iv: iv.toString("hex") });
  }

  if (algorithm === "ChaCha20") {
    const key = crypto.createHash("sha256").update(secret).digest(); // 32 bytes (256 bits)
    const iv = crypto.randomBytes(16); // 16 bytes nonce for chacha20 in Node.js
    const cipher = crypto.createCipheriv("chacha20", key, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");
    return JSON.stringify({ cipher: encrypted, iv: iv.toString("hex") });
  }

  if (algorithm === "AES-256") {
    const key = crypto.createHash("sha256").update(secret).digest(); // 32 bytes (256 bits)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");
    return JSON.stringify({ cipher: encrypted, iv: iv.toString("hex") });
  }

  if (algorithm === "AES-256 + RSA") {
    const randomKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv("aes-256-cbc", randomKey, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");

    const encryptedKeyBuffer = crypto.publicEncrypt(
      {
        key: rsaKeyPair.publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      randomKey
    );

    return JSON.stringify({
      aesCipher: encrypted,
      encryptedKey: encryptedKeyBuffer.toString("base64"),
      iv: iv.toString("hex")
    });
  }

  if (algorithm === "ECC") {
    // Generate ephemeral ECDH keypair
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.generateKeys();
    const ephemeralPubKey = ecdh.getPublicKey("hex");

    // Deriving shared secret deterministically from ephemeralPubKey for simulated ECDH
    const sharedSecret = crypto.createHash("sha256").update(ephemeralPubKey).digest();
    const key = crypto.createHash("sha256").update(sharedSecret).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");

    return JSON.stringify({
      cipher: encrypted,
      ephemeralPubKey,
      iv: iv.toString("hex")
    });
  }

  return message;
}

function decryptMessage(cipherText, algorithm, cryptoContext = {}) {
  const secret = cryptoContext.aesKey || SHARED_SECRET;
  const rsaKeyPair = cryptoContext.rsaKeyPair || RSA;

  try {
    const parsed = JSON.parse(cipherText);

    if (algorithm === "AES-128") {
      const key = crypto.createHash("md5").update(secret).digest();
      const iv = Buffer.from(parsed.iv, "hex");
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      let decrypted = decipher.update(parsed.cipher, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    if (algorithm === "ChaCha20") {
      const key = crypto.createHash("sha256").update(secret).digest();
      const iv = Buffer.from(parsed.iv, "hex");
      const decipher = crypto.createDecipheriv("chacha20", key, iv);
      let decrypted = decipher.update(parsed.cipher, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    if (algorithm === "AES-256") {
      const key = crypto.createHash("sha256").update(secret).digest();
      const iv = Buffer.from(parsed.iv, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(parsed.cipher, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    if (algorithm === "AES-256 + RSA") {
      const encryptedKeyBuffer = Buffer.from(parsed.encryptedKey, "base64");
      const randomKey = crypto.privateDecrypt(
        {
          key: rsaKeyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        encryptedKeyBuffer
      );
      const iv = Buffer.from(parsed.iv, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", randomKey, iv);
      let decrypted = decipher.update(parsed.aesCipher, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    if (algorithm === "ECC") {
      const sharedSecret = crypto.createHash("sha256").update(parsed.ephemeralPubKey).digest();
      const key = crypto.createHash("sha256").update(sharedSecret).digest();
      const iv = Buffer.from(parsed.iv, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(parsed.cipher, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }
  } catch (err) {
    // Return raw cipher text if JSON parsing fails (e.g. legacy records)
    return cipherText;
  }

  return cipherText;
}

function encryptBuffer(buffer, algorithm, cryptoContext = {}) {
  const base = buffer.toString("base64");
  return Buffer.from(encryptMessage(base, algorithm, cryptoContext), "utf8");
}

function decryptBuffer(buffer, algorithm, cryptoContext = {}) {
  const base = decryptMessage(buffer.toString("utf8"), algorithm, cryptoContext);
  return Buffer.from(base, "base64");
}

module.exports = {
  encryptMessage,
  decryptMessage,
  encryptBuffer,
  decryptBuffer
};
