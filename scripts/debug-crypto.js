const { neon } = require("@neondatabase/serverless")
const crypto = require("crypto")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") })

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const configs = await sql`SELECT pass FROM email_config WHERE ativo = true LIMIT 1`
  if (configs.length === 0) {
    console.log("Nenhuma config")
    process.exit(1)
  }

  const pass = configs[0].pass
  console.log("Pass raw:", pass)
  console.log("Parts:", pass.split(":").length)

  const key = process.env.ENCRYPTION_KEY
  console.log("KEY exists:", !!key)
  console.log("KEY length:", key ? key.length : 0)

  const derived = crypto.createHash("sha256").update(key).digest()
  console.log("Derived key (hex):", derived.toString("hex"))

  // Try to decrypt
  const parts = pass.split(":")
  if (parts.length === 3) {
    const [ivHex, authTagHex, data] = parts
    console.log("IV:", ivHex)
    console.log("AuthTag:", authTagHex)
    console.log("Data:", data.substring(0, 30) + "...")

    const decipher = crypto.createDecipheriv("aes-256-gcm", derived, Buffer.from(ivHex, "hex"))
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
    try {
      const decrypted = decipher.update(data, "hex", "utf8") + decipher.final("utf8")
      console.log("Decrypted:", decrypted)
    } catch (e) {
      console.log("Decrypt error:", e.message)
    }
  }

  process.exit(0)
}

main()
