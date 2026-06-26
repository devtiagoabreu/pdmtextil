const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const match = envContent.match(/^DATABASE_URL="(.+)"$/m)
if (!match) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const databaseUrl = match[1]
const sql = postgres(databaseUrl, { prepare: false })

async function main() {
  console.log("Renomeando itens de menu...")

  const r1 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Solicitações de Desenvolvimento'
    WHERE url = '/comercial/solicitacoes' AND titulo = 'Solicitações'
  `)
  console.log(`  "/comercial/solicitacoes": ${r1.count} linha(s)`)

  const r2 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Nova Solicitação de Desenvolvimento'
    WHERE url = '/comercial/solicitacoes/nova' AND titulo = 'Nova Solicitação'
  `)
  console.log(`  "/comercial/solicitacoes/nova": ${r2.count} linha(s)`)

  const r3 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Amostras de Desenvolvimento'
    WHERE url = '/amostras' AND titulo = 'Amostras'
  `)
  console.log(`  "/amostras": ${r3.count} linha(s)`)

  const r4 = await sql.unsafe(`
    UPDATE user_menus
    SET titulo = 'Solicitações de Desenvolvimento'
    WHERE titulo = 'Solicitações'
  `)
  console.log(`  Menu group "Solicitações": ${r4.count} linha(s)`)

  const r5 = await sql.unsafe(`
    UPDATE user_menus
    SET titulo = 'Amostras de Desenvolvimento'
    WHERE titulo = 'Amostras'
  `)
  console.log(`  Menu group "Amostras": ${r5.count} linha(s)`)

  // User-specific menu items (custom menus added by users)
  const r6 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Dashboard Solicitações de Desenvolvimento'
    WHERE url = '/dashboard' AND titulo = 'Dashboard Solicitações'
  `)
  console.log(`  "/dashboard" (user): ${r6.count} linha(s)`)

  const r7 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Dashboard Amostras de Desenvolvimento'
    WHERE url = '/dashboard/amostras' AND titulo = 'Dashboard Amostras'
  `)
  console.log(`  "/dashboard/amostras" (user): ${r7.count} linha(s)`)

  const r8 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Kanban — Solicitações de Desenvolvimento'
    WHERE url = '/comercial/solicitacoes/kanban' AND titulo = 'Kanban — Solicitações'
  `)
  console.log(`  "/comercial/solicitacoes/kanban" (user): ${r8.count} linha(s)`)

  const r9 = await sql.unsafe(`
    UPDATE user_menu_itens
    SET titulo = 'Kanban — Amostras de Desenvolvimento'
    WHERE url = '/amostras/kanban' AND titulo = 'Kanban — Amostras'
  `)
  console.log(`  "/amostras/kanban" (user): ${r9.count} linha(s)`)

  console.log("✅ Concluído!")
  await sql.end()
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})
