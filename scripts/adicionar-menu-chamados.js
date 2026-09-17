// Cria o menu "Chamados" role-based (DEFAULT) com os itens do módulo, nos 4 bancos.
// Idempotente: se o menu/itens já existirem, não duplica.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })
const { Pool } = require("pg")

const TITULO_MENU = "Chamados"
const ITENS = [
  { titulo: "Chamados", url: "/chamados", ordem: 0 },
  { titulo: "Novo Chamado", url: "/chamados/novo", ordem: 1 },
  { titulo: "Dashboard", url: "/chamados/dashboard", ordem: 2 },
]

async function aplicarMenu(name, url) {
  const pool = new Pool({ connectionString: url })
  try {
    const existing = await pool.query(
      `SELECT id FROM user_menus WHERE role = 'DEFAULT' AND usuario_id IS NULL AND titulo = $1 ORDER BY id`,
      [TITULO_MENU]
    )
    let menuId = existing.rowCount > 0 ? existing.rows[0].id : null

    if (!menuId) {
      const nextOrdem = await pool.query(
        `SELECT COALESCE(MAX(ordem), -1) + 1 AS prox FROM user_menus WHERE role = 'DEFAULT' AND usuario_id IS NULL`
      )
      const ins = await pool.query(
        `INSERT INTO user_menus (role, titulo, icone, ordem, ativo, created_at, updated_at)
         VALUES ('DEFAULT', $1, 'LifeBuoy', $2, true, now(), now()) RETURNING id`,
        [TITULO_MENU, nextOrdem.rows[0].prox]
      )
      menuId = ins.rows[0].id
      console.log(`[${name}] Menu '${TITULO_MENU}' criado: id=${menuId}`)
    } else {
      console.log(`[${name}] Menu '${TITULO_MENU}' ja existia: id=${menuId}`)
    }

    for (const item of ITENS) {
      const { rowCount } = await pool.query(
        `SELECT id FROM user_menu_itens WHERE user_menu_id = $1 AND url = $2`,
        [menuId, item.url]
      )
      if (rowCount > 0) {
        console.log(`[${name}]   (ja existe) ${item.titulo} ${item.url}`)
        continue
      }
      await pool.query(
        `INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem, ativo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, now(), now())`,
        [menuId, item.titulo, item.url, item.ordem]
      )
      console.log(`[${name}]   + ${item.titulo} ${item.url}`)
    }
  } catch (e) {
    console.error(`[${name}] ERROR - ${e.message}`)
  } finally {
    await pool.end()
  }
}

async function main() {
  const targets = [
    { name: "pdm_textil", url: process.env.DATABASE_URL },
    { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
    { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
    { name: "neon", url: process.env.DATABASE_URL_NEON },
  ]
  for (const t of targets) {
    if (t.url) await aplicarMenu(t.name, t.url)
  }
  console.log("Done!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})