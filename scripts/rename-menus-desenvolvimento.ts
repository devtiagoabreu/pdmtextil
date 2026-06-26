import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { db } from "../src/lib/db/index"
import { userMenuItens, userMenus } from "../src/lib/db/schema/user-menus"
import { eq, and } from "drizzle-orm"

async function main() {
  console.log("Renomeando itens de menu...")

  // Itens
  const r1 = await db.update(userMenuItens)
    .set({ titulo: "Solicitações de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/comercial/solicitacoes"), eq(userMenuItens.titulo, "Solicitações")))
  console.log(`  "/comercial/solicitacoes": ${r1.count} linha(s)`)

  const r2 = await db.update(userMenuItens)
    .set({ titulo: "Nova Solicitação de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/comercial/solicitacoes/nova"), eq(userMenuItens.titulo, "Nova Solicitação")))
  console.log(`  "/comercial/solicitacoes/nova": ${r2.count} linha(s)`)

  const r3 = await db.update(userMenuItens)
    .set({ titulo: "Amostras de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/amostras"), eq(userMenuItens.titulo, "Amostras")))
  console.log(`  "/amostras": ${r3.count} linha(s)`)

  // Grupos de menu
  const r4 = await db.update(userMenus)
    .set({ titulo: "Solicitações de Desenvolvimento" })
    .where(eq(userMenus.titulo, "Solicitações"))
  console.log(`  Menu group "Solicitações": ${r4.count} linha(s)`)

  const r5 = await db.update(userMenus)
    .set({ titulo: "Amostras de Desenvolvimento" })
    .where(eq(userMenus.titulo, "Amostras"))
  console.log(`  Menu group "Amostras": ${r5.count} linha(s)`)

  // User-specific menu items (custom menus)
  const r6 = await db.update(userMenuItens)
    .set({ titulo: "Dashboard Solicitações de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/dashboard"), eq(userMenuItens.titulo, "Dashboard Solicitações")))
  console.log(`  "/dashboard" (user): ${r6.count} linha(s)`)

  const r7 = await db.update(userMenuItens)
    .set({ titulo: "Dashboard Amostras de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/dashboard/amostras"), eq(userMenuItens.titulo, "Dashboard Amostras")))
  console.log(`  "/dashboard/amostras" (user): ${r7.count} linha(s)`)

  const r8 = await db.update(userMenuItens)
    .set({ titulo: "Kanban — Solicitações de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/comercial/solicitacoes/kanban"), eq(userMenuItens.titulo, "Kanban — Solicitações")))
  console.log(`  "/comercial/solicitacoes/kanban" (user): ${r8.count} linha(s)`)

  const r9 = await db.update(userMenuItens)
    .set({ titulo: "Kanban — Amostras de Desenvolvimento" })
    .where(and(eq(userMenuItens.url, "/amostras/kanban"), eq(userMenuItens.titulo, "Kanban — Amostras")))
  console.log(`  "/amostras/kanban" (user): ${r9.count} linha(s)`)

  console.log("✅ Concluído!")
  process.exit(0)
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})
