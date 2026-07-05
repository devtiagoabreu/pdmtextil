const { neon } = require("@neondatabase/serverless")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL)

async function check() {
  const menus = await sql`SELECT id, role FROM user_menus WHERE (titulo = 'CRM' OR titulo LIKE '%CRM%') AND ativo = true`
  for (const m of menus) {
    const itens = await sql`SELECT titulo, url, ordem FROM user_menu_itens WHERE user_menu_id = ${m.id} ORDER BY ordem`
    console.log("--- Menu (role:", m.role, ") ---")
    itens.forEach(i => console.log("  ", i.ordem, i.titulo, "(" + i.url + ")"))
  }
  process.exit(0)
}
check().catch(e => { console.error(e); process.exit(1) })
