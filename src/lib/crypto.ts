import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SEPARATOR = ":"

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required for crypto operations")
  return crypto.createHash("sha256").update(key).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return `${iv.toString("hex")}${SEPARATOR}${authTag}${SEPARATOR}${encrypted}`
}

export function decrypt(encrypted: string): string {
  const parts = encrypted.split(SEPARATOR)
  if (parts.length !== 3) return encrypted
  const [ivHex, authTagHex, data] = parts
  try {
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(data, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch {
    return encrypted
  }
}
