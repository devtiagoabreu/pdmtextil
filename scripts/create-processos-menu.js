// Cria o menu "Processos" (Engenharia de Processos) para o usuário Tiago de Abreu no banco principal.
// Idempotente: se o menu já existir, não duplica.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })
const { Pool } = require("pg")

const ITENS = [
  { titulo: "Mapa de Processos", url: "/processos", ordem: 0 },
  { titulo: "Empresas", url: "/processos/empresas", ordem: 1 },
  { titulo: "Sites", url: "/processos/sites", ordem: 2 },
  { titulo: "Áreas", url: "/processos/areas", ordem: 3 },
  { titulo: "Processos", url: "/processos/processos", ordem: 4 },
  { titulo: "Subprocessos", url: "/processos/subprocessos", ordem: 5 },
  { titulo: "Atividades", url: "/processos/atividades", ordem: 6 },
]

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const users = await pool.query(
    `SELECT id, email, name, role FROM usuarios WHERE (name ILIKE '%tiago%abreu%' OR email ILIKE '%tiago%') AND ativo = true ORDER BY id`
  )
  if (users.rowCount === 0) {
    console.log("Nenhum usuario Tiago de Abreu encontrado.")
    await pool.end()
    process.exit(1)
  }
  const user = users.rows[0]
  console.log(`Usuario: [${user.role}] id=${user.id} ${user.name} <${user.email}>`)

  const existing = await pool.query(
    `SELECT id FROM user_menus WHERE usuario_id = $1 AND titulo = 'Processos' ORDER BY id`,
    [user.id]
  )
  let menuId = existing.rowCount > 0 ? existing.rows[0].id : null

  if (!menuId) {
    const nextOrdem = await pool.query(
      `SELECT COALESCE(MAX(ordem), -1) + 1 AS prox FROM user_menus WHERE usuario_id = $1`,
      [user.id]
    )
    const ordem = nextOrdem.rows[0].prox
    const ins = await pool.query(
      `INSERT INTO user_menus (usuario_id, titulo, icone, ordem, ativo, created_at, updated_at)
       VALUES ($1, 'Processos', NULL, $2, true, now(), now()) RETURNING id`,
      [user.id, ordem]
    )
    menuId = ins.rows[0].id
    console.log(`Menu criado: id=${menuId} ordem=${ordem}`)
  } else {
    console.log(`Menu ja existia: id=${menuId}`)
  }

  for (const item of ITENS) {
    const { rowCount } = await pool.query(
      `SELECT id FROM user_menu_itens WHERE user_menu_id = $1 AND url = $2`,
      [menuId, item.url]
    )
    if (rowCount > 0) {
      console.log(`  (ja existe) ${item.titulo} ${item.url}`)
      continue
    }
    const ins = await pool.query(
      `INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem, ativo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, now(), now()) RETURNING id`,
      [menuId, item.titulo, item.url, item.ordem]
    )
    console.log(`  + ${item.titulo} ${item.url} (id=${ins.rows[0].id})`)
  }

  const final = await pool.query(
    `SELECT ui.id, ui.titulo, ui.url, ui.ordem FROM user_menu_itens ui
     WHERE ui.user_menu_id = $1 AND ui.ativo = true ORDER BY ui.ordem`,
    [menuId]
  )
  console.log(`\nMenu Processos (id=${menuId}) com ${final.rowCount} itens:`)
  final.rows.forEach((i) => console.log(`  ${i.ordem}. ${i.titulo} (${i.url})`))

  await pool.end()
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })