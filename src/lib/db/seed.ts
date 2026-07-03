import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { db } from "./index"
import { usuarios } from "./schema/usuarios"
import { userMenus, userMenuItens } from "./schema/user-menus"
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

  // Menus CRM para o perfil COMERCIAL
  const [menuCrm] = await db.insert(userMenus).values({
    role: "COMERCIAL",
    titulo: "CRM",
    ordem: 1,
  }).returning()

  await db.insert(userMenuItens).values([
    { userMenuId: menuCrm.id, titulo: "Dashboard", url: "/comercial/crm", ordem: 0 },
    { userMenuId: menuCrm.id, titulo: "Empresas", url: "/comercial/crm/empresas", ordem: 1 },
    { userMenuId: menuCrm.id, titulo: "Leads", url: "/comercial/crm/leads", ordem: 2 },
  ])

  // Menu CRM também visível para ADMIN
  const [menuCrmAdmin] = await db.insert(userMenus).values({
    role: "ADMIN",
    titulo: "CRM",
    ordem: 2,
  }).returning()

  await db.insert(userMenuItens).values([
    { userMenuId: menuCrmAdmin.id, titulo: "Dashboard", url: "/comercial/crm", ordem: 0 },
    { userMenuId: menuCrmAdmin.id, titulo: "Empresas", url: "/comercial/crm/empresas", ordem: 1 },
    { userMenuId: menuCrmAdmin.id, titulo: "Leads", url: "/comercial/crm/leads", ordem: 2 },
  ])

  console.log("✅ Seed concluído!")
}
seed().catch(console.error)
