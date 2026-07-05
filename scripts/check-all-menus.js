const { neon } = require("@neondatabase/serverless")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL)

async function check() {
  const menus = await sql`SELECT id, role, titulo FROM user_menus WHERE ativo = true ORDER BY role, titulo`
  for (const m of menus) {
    const itens = await sql`SELECT titulo, url, ordem FROM user_menu_itens WHERE user_menu_id = ${m.id} ORDER BY ordem`
    console.log("--- Menu:", m.titulo, "(role:", m.role, ") ---")
    itens.forEach(i => console.log("  ", i.ordem, i.titulo, "(" + i.url + ")"))
  }
  process.exit(0)
}
check().catch(e => { console.error(e); process.exit(1) })
