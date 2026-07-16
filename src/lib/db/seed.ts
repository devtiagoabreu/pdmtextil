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
    { userMenuId: menuCrm.id, titulo: "Pessoas", url: "/comercial/crm/pessoas", ordem: 1 },
    { userMenuId: menuCrm.id, titulo: "Contatos", url: "/comercial/crm/contatos", ordem: 2 },
    { userMenuId: menuCrm.id, titulo: "Leads", url: "/comercial/crm/leads", ordem: 3 },
    { userMenuId: menuCrm.id, titulo: "Oportunidades", url: "/comercial/crm/oportunidades", ordem: 4 },
    { userMenuId: menuCrm.id, titulo: "Oportunidades (Kanban)", url: "/comercial/crm/oportunidades/kanban", ordem: 5 },
    { userMenuId: menuCrm.id, titulo: "Visitas", url: "/comercial/crm/visitas", ordem: 6 },
    { userMenuId: menuCrm.id, titulo: "Tarefas", url: "/comercial/crm/tarefas", ordem: 7 },
    { userMenuId: menuCrm.id, titulo: "Propostas", url: "/comercial/crm/propostas", ordem: 8 },
    { userMenuId: menuCrm.id, titulo: "Regiões", url: "/comercial/crm/regioes", ordem: 9 },
    { userMenuId: menuCrm.id, titulo: "Equipes", url: "/comercial/crm/equipes", ordem: 10 },
    { userMenuId: menuCrm.id, titulo: "Campanhas", url: "/comercial/crm/campanhas", ordem: 11 },
    { userMenuId: menuCrm.id, titulo: "Conversas WhatsApp", url: "/comercial/crm/conversas", ordem: 12 },
    { userMenuId: menuCrm.id, titulo: "Notificações", url: "/comercial/crm/notificacoes", ordem: 13 },
    { userMenuId: menuCrm.id, titulo: "Relatórios", url: "/comercial/crm/relatorios", ordem: 14 },
  ])

  // Menu CRM para role CRM
  const [menuCrmRole] = await db.insert(userMenus).values({
    role: "CRM",
    titulo: "CRM",
    ordem: 1,
  }).returning()

  await db.insert(userMenuItens).values([
    { userMenuId: menuCrmRole.id, titulo: "Dashboard", url: "/comercial/crm", ordem: 0 },
    { userMenuId: menuCrmRole.id, titulo: "Pessoas", url: "/comercial/crm/pessoas", ordem: 1 },
    { userMenuId: menuCrmRole.id, titulo: "Leads", url: "/comercial/crm/leads", ordem: 2 },
    { userMenuId: menuCrmRole.id, titulo: "Contatos", url: "/comercial/crm/contatos", ordem: 3 },
    { userMenuId: menuCrmRole.id, titulo: "Oportunidades", url: "/comercial/crm/oportunidades", ordem: 4 },
    { userMenuId: menuCrmRole.id, titulo: "Oportunidades (Kanban)", url: "/comercial/crm/oportunidades/kanban", ordem: 5 },
    { userMenuId: menuCrmRole.id, titulo: "Visitas", url: "/comercial/crm/visitas", ordem: 6 },
    { userMenuId: menuCrmRole.id, titulo: "Tarefas", url: "/comercial/crm/tarefas", ordem: 7 },
    { userMenuId: menuCrmRole.id, titulo: "Propostas", url: "/comercial/crm/propostas", ordem: 8 },
    { userMenuId: menuCrmRole.id, titulo: "Regiões", url: "/comercial/crm/regioes", ordem: 9 },
    { userMenuId: menuCrmRole.id, titulo: "Equipes", url: "/comercial/crm/equipes", ordem: 10 },
    { userMenuId: menuCrmRole.id, titulo: "Campanhas", url: "/comercial/crm/campanhas", ordem: 11 },
    { userMenuId: menuCrmRole.id, titulo: "Conversas WhatsApp", url: "/comercial/crm/conversas", ordem: 12 },
    { userMenuId: menuCrmRole.id, titulo: "Notificações", url: "/comercial/crm/notificacoes", ordem: 13 },
    { userMenuId: menuCrmRole.id, titulo: "Relatórios", url: "/comercial/crm/relatorios", ordem: 14 },
  ])

  // Menu CRM também visível para ADMIN
  const [menuCrmAdmin] = await db.insert(userMenus).values({
    role: "ADMIN",
    titulo: "CRM",
    ordem: 2,
  }).returning()

  await db.insert(userMenuItens).values([
    { userMenuId: menuCrmAdmin.id, titulo: "Dashboard", url: "/comercial/crm", ordem: 0 },
    { userMenuId: menuCrmAdmin.id, titulo: "Pessoas", url: "/comercial/crm/pessoas", ordem: 1 },
    { userMenuId: menuCrmAdmin.id, titulo: "Contatos", url: "/comercial/crm/contatos", ordem: 2 },
    { userMenuId: menuCrmAdmin.id, titulo: "Leads", url: "/comercial/crm/leads", ordem: 3 },
    { userMenuId: menuCrmAdmin.id, titulo: "Oportunidades", url: "/comercial/crm/oportunidades", ordem: 4 },
    { userMenuId: menuCrmAdmin.id, titulo: "Oportunidades (Kanban)", url: "/comercial/crm/oportunidades/kanban", ordem: 5 },
    { userMenuId: menuCrmAdmin.id, titulo: "Visitas", url: "/comercial/crm/visitas", ordem: 6 },
    { userMenuId: menuCrmAdmin.id, titulo: "Tarefas", url: "/comercial/crm/tarefas", ordem: 7 },
    { userMenuId: menuCrmAdmin.id, titulo: "Propostas", url: "/comercial/crm/propostas", ordem: 8 },
    { userMenuId: menuCrmAdmin.id, titulo: "Regiões", url: "/comercial/crm/regioes", ordem: 9 },
    { userMenuId: menuCrmAdmin.id, titulo: "Equipes", url: "/comercial/crm/equipes", ordem: 10 },
    { userMenuId: menuCrmAdmin.id, titulo: "Campanhas", url: "/comercial/crm/campanhas", ordem: 11 },
    { userMenuId: menuCrmAdmin.id, titulo: "Conversas WhatsApp", url: "/comercial/crm/conversas", ordem: 12 },
    { userMenuId: menuCrmAdmin.id, titulo: "Notificações", url: "/comercial/crm/notificacoes", ordem: 13 },
    { userMenuId: menuCrmAdmin.id, titulo: "Relatórios", url: "/comercial/crm/relatorios", ordem: 14 },
  ])

  console.log("✅ Seed concluído!")
}
seed().catch(console.error)
