import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { db } from "./index"
import { usuarios } from "./schema/usuarios"
import bcrypt from "bcryptjs"

console.log("DB URL:", process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"))

async function seed() {
  console.log("🌱 Iniciando seed...")
  const passwordHash = await bcrypt.hash("123456", 10)
  await db.insert(usuarios).values([
    { email: "comercial@promoda.com", password: passwordHash, name: "Ana Comercial", role: "COMERCIAL", ativo: true },
    { email: "tecelagem@promoda.com", password: passwordHash, name: "Carlos Tecelagem", role: "TECELAGEM", ativo: true },
    { email: "beneficiamento@promoda.com", password: passwordHash, name: "Mariana Beneficiamento", role: "BENEFICIAMENTO", ativo: true },
    { email: "admin@promoda.com", password: passwordHash, name: "Admin Sistema", role: "ADMIN", ativo: true },
  ])
  console.log("✅ Seed concluído!")
}
seed().catch(console.error)
