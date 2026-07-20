const crypto = require("crypto");
const os = require("os");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PEPPER = "sg-local-2024-enc-key";

function deriveKey() {
  const machineId = process.env.RENDER
    ? (process.env.RENDER_EXTERNAL_URL || "render")
    : `${os.hostname()}-${os.platform()}-${os.arch()}`;
  const seed = `${machineId}-${PEPPER}`;
  return crypto.createHash("sha256").update(seed).digest();
}

function encrypt(text) {
  if (!text) return null;
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

function decrypt(encoded) {
  if (!encoded) return null;
  try {
    const key = deriveKey();
    const parts = encoded.split(":");
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

module.exports = { encrypt, decrypt };
