// One-off: adiciona o menu pessoal "Ativos e Vistorias" ao usuário Tiago de Abreu nos 4 bancos.
// Idempotente: casa o menu por (usuario_id, titulo) e os itens por url.
//
// Uso: node scripts/adicionar-menu-ativos-tiago.js [--db=pdm_textil]

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const USER_NAME = "TIAGO DE ABREU"
const MENU_TITULO = "Ativos e Vistorias"
const MENU_ICONE = "ShieldCheck"

const ITENS = [
  { titulo: "Dashboard", url: "/ativos/dashboard", ordem: 0 },
  { titulo: "Categorias", url: "/ativos/categorias", ordem: 1 },
  { titulo: "Ativos", url: "/ativos/ativos", ordem: 2 },
  { titulo: "Tipos de Vistoria", url: "/ativos/tipos-vistoria", ordem: 3 },
  { titulo: "Planos de Vistoria", url: "/ativos/planos", ordem: 4 },
  { titulo: "Vistorias", url: "/ativos/vistorias", ordem: 5 },
]

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]
const onlyDb = process.argv.includes("--db") ? process.argv[process.argv.indexOf("--db") + 1] || (() => { const a = process.argv.find(x => x.startsWith("--db=")); return a ? a.split("=")[1] : null })() : null

async function run(db, name) {
  const [user] = await db`select id, name, role from usuarios where upper(name) = upper(${USER_NAME})`
  if (!user) {
    console.log(`[${name}] usuário "${USER_NAME}" não encontrado — pulado`)
    return
  }
  console.log(`[${name}] usuário: id ${user.id} (${user.name}, ${user.role})`)

  let [menu] = await db`select * from user_menus where usuario_id = ${user.id} and titulo = ${MENU_TITULO}`
  if (!menu) {
    const [max] = await db`select coalesce(max(ordem), -1)::int as m from user_menus where usuario_id = ${user.id}`
    const ordens = await db`select ordem from user_menus where usuario_id = ${user.id}`
    const usadas = new Set(ordens.map((r) => r.ordem))
    let ordem = max.m + 1
    while (usadas.has(ordem)) ordem++
    const [novo] = await db`insert into user_menus (usuario_id, titulo, icone, ordem, ativo) values (${user.id}, ${MENU_TITULO}, ${MENU_ICONE}, ${ordem}, true) returning *`
    menu = novo
    console.log(`  menu criado: id ${menu.id}, titulo "${menu.titulo}", ordem ${menu.ordem}`)
  } else {
    console.log(`  menu já existe: id ${menu.id}, titulo "${menu.titulo}"`)
  }

  for (const item of ITENS) {
    const [existente] = await db`select id from user_menu_itens where user_menu_id = ${menu.id} and url = ${item.url}`
    if (existente) {
      console.log(`  item já existe: "${item.titulo}" (${item.url})`)
      continue
    }
    await db`insert into user_menu_itens (user_menu_id, titulo, url, ordem, ativo) values (${menu.id}, ${item.titulo}, ${item.url}, ${item.ordem}, true)`
    console.log(`  item criado: "${item.titulo}" (${item.url})`)
  }
}

async function main() {
  for (const b of DATABASES) {
    if (onlyDb && b.name !== onlyDb) continue
    if (!b.url) {
      console.log(`[${b.name}] sem DATABASE_URL definida — pulado`)
      continue
    }
    const pg = postgres(b.url, { max: 1 })
    try {
      await run(pg, b.name)
    } finally {
      await pg.end()
    }
  }
  console.log("Concluído.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})