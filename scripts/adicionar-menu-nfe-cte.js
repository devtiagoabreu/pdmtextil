// Libera a tela /ferramentas/nfe-cte (NF-e → CT-e por Período) para usuários
// nomeados em USUARIOS, percorrendo os 4 bancos.
//
// Contexto de por que o script existe: o menu pessoal SUBSTITUI o menu do role
// (src/app/api/user/menus/route.ts:52 tem early-return quando o usuário já tem
// menus próprios, e src/components/layout/sidebar.tsx:179 renderiza o que a API
// devolve, sem mesclar). Então não dá para "só adicionar um item" a alguém sem
// menu pessoal — ela passaria a ver apenas o grupo criado.
//
// O script então:
//   1. acha o usuário pelo nome;
//   2. se ele ainda não tem menu pessoal, clona os menus/itens do role dele
//      (mesma regra do fork de src/lib/menus-fork.ts, casando por título);
//   3. acha o grupo de Ferramentas no menu pessoal e garante o item da tela.
//
// O grupo é casado primeiro pelo título exato; se não houver, usa o grupo que já
// contém itens de /ferramentas (existe um "Fermentas" com typo no Neon), para
// não criar um segundo grupo de Ferramentas na mesma barra lateral.
//
// Idempotente: roda quantas vezes quiser sem duplicar menu nem item.
//
// Uso:
//   node scripts/adicionar-menu-nfe-cte.js
//   node scripts/adicionar-menu-nfe-cte.js --db=pdm_textil
//   node scripts/adicionar-menu-nfe-cte.js --dry-run
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON).

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const USUARIOS = ["EDINA DOMICIANO", "TIAGO DE ABREU"]
const MENU_TITULO = "Ferramentas"
const ITEM = { titulo: "NF-e → CT-e por Período", url: "/ferramentas/nfe-cte" }
// A tela não funciona sem a integração registrada; avisamos em vez de falhar
// para não deixar o menu meio configurado.
const INTEGRACAO = "api_rel_nfe_cte_periodo"

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

const args = process.argv.slice(2)
function argValue(flag) {
  const item = args.find((a) => a.startsWith(flag + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const dryRun = args.includes("--dry-run")

/**
 * Garante que o usuário tenha uma cópia pessoal dos menus do role, para que
 * adicionar um item não apague o resto do menu dele. Mesma estratégia de
 * src/lib/menus-fork.ts: casa por título e só cria o que falta.
 *
 * Devolve o mapa titulo -> id dos menus pessoais, incluindo os que o próprio
 * fork acabou de criar, para o dry-run enxergar o grupo clonado.
 */
async function garantirMenusPessoais(db, usuario, log) {
  const existentes = await db`
    select id, titulo from user_menus where usuario_id = ${usuario.id} order by ordem
  `
  const porTitulo = new Map(existentes.map((m) => [m.titulo, m.id]))

  if (existentes.length > 0) {
    log("menu pessoal já existe — mantido como está")
    return porTitulo
  }

  const doRole = await db`
    select id, titulo, icone, ordem, ativo
    from user_menus
    where role = ${usuario.role} and usuario_id is null
    order by ordem
  `
  if (doRole.length === 0) {
    log(`nenhum menu de role "${usuario.role}" para clonar — nada a fazer`)
    return porTitulo
  }
  log(`sem menu pessoal: clonando ${doRole.length} menu(s) do role "${usuario.role}"`)

  let proximoId = -1
  for (const menu of doRole) {
    let novoId
    if (dryRun) {
      novoId = proximoId--
      log(`  [dry-run] menu "${menu.titulo}" (ordem ${menu.ordem})`)
    } else {
      const [criado] = await db`
        insert into user_menus (usuario_id, titulo, icone, ordem, ativo)
        values (${usuario.id}, ${menu.titulo}, ${menu.icone}, ${menu.ordem}, ${menu.ativo !== false})
        returning id
      `
      novoId = criado.id
    }
    porTitulo.set(menu.titulo, novoId)

    const itens = await db`
      select titulo, url, ordem, ativo
      from user_menu_itens
      where user_menu_id = ${menu.id}
      order by ordem
    `
    for (const item of itens) {
      if (dryRun) continue
      await db`
        insert into user_menu_itens (user_menu_id, titulo, url, ordem, ativo)
        values (${novoId}, ${item.titulo}, ${item.url}, ${item.ordem}, ${item.ativo !== false})
      `
    }
    log(`  menu "${menu.titulo}" clonado com ${itens.length} item(ns)`)
  }
  return porTitulo
}

/** Grupo que exibirá a tela: título exato, senão o que já tem item /ferramentas. */
async function acharGrupoFerramentas(db, usuario, porTitulo, log) {
  if (porTitulo.has(MENU_TITULO)) return { id: porTitulo.get(MENU_TITULO), titulo: MENU_TITULO }

  const candidatos = await db`
    select distinct m.id, m.titulo
    from user_menus m
    join user_menu_itens i on i.user_menu_id = m.id
    where m.usuario_id = ${usuario.id} and i.url like '/ferramentas%'
  `
  if (candidatos.length > 0) {
    const escolhido = candidatos[0]
    if (candidatos.length > 1) {
      log(
        `  ⚠ ${candidatos.length} grupos contêm telas de Ferramentas (${candidatos
          .map((c) => `"${c.titulo}"`)
          .join(", ")}) — usando "${escolhido.titulo}"`
      )
    } else {
      log(`  usando o grupo "${escolhido.titulo}" (contém telas de Ferramentas)`)
    }
    return escolhido
  }
  return null
}

async function run(db, nomeBanco) {
  console.log(`\n=== ${nomeBanco} ===`)

  const [integracao] = await db`
    select id, ativo, telas from integracoes where nome = ${INTEGRACAO} limit 1
  `
  if (!integracao) {
    console.log(
      `  ⚠ integração "${INTEGRACAO}" ausente — a tela vai abrir sem dados. Rode: node scripts/seed-integracao-cte.js --db=${nomeBanco}`
    )
  } else if (!integracao.ativo) {
    console.log(`  ⚠ integração "${INTEGRACAO}" está inativa (id ${integracao.id})`)
  } else {
    console.log(`  integração OK (id ${integracao.id}, telas ${integracao.telas})`)
  }

  for (const nome of USUARIOS) {
    const [usuario] = await db`
      select id, name, role from usuarios where upper(name) = upper(${nome}) limit 1
    `
    if (!usuario) {
      console.log(`  ${nome}: não encontrado — pulado`)
      continue
    }
    console.log(`\n  ${usuario.name} (id ${usuario.id}, role ${usuario.role})`)

    const porTitulo = await garantirMenusPessoais(db, usuario, (m) => console.log(`    ${m}`))
    let grupo = await acharGrupoFerramentas(db, usuario, porTitulo, (m) => console.log(`    ${m}`))

    if (!grupo) {
      console.log(`    sem grupo de Ferramentas no menu pessoal — criando "${MENU_TITULO}"`)
      if (dryRun) {
        grupo = { id: -1, titulo: MENU_TITULO }
      } else {
        const [max] = await db`
          select coalesce(max(ordem), -1)::int as m
          from user_menus where usuario_id = ${usuario.id}
        `
        const [criado] = await db`
          insert into user_menus (usuario_id, titulo, icone, ordem, ativo)
          values (${usuario.id}, ${MENU_TITULO}, 'Wrench', ${max.m + 1}, true)
          returning id, titulo
        `
        grupo = criado
      }
    }

    const [existente] = await db`
      select id from user_menu_itens
      where user_menu_id = ${grupo.id} and url = ${ITEM.url}
      limit 1
    `
    if (existente) {
      console.log(`    item "${ITEM.titulo}" já existe em "${grupo.titulo}"`)
      continue
    }

    let ordem
    if (dryRun) {
      ordem = 0
      console.log(
        `    [dry-run] item "${ITEM.titulo}" -> ${ITEM.url} em "${grupo.titulo}"`
      )
      continue
    }
    const [max] = await db`
      select coalesce(max(ordem), -1)::int as m
      from user_menu_itens where user_menu_id = ${grupo.id}
    `
    const ordens = await db`select ordem from user_menu_itens where user_menu_id = ${grupo.id}`
    const usadas = new Set(ordens.map((o) => o.ordem))
    ordem = max.m + 1
    while (usadas.has(ordem)) ordem++

    await db`
      insert into user_menu_itens (user_menu_id, titulo, url, ordem, ativo)
      values (${grupo.id}, ${ITEM.titulo}, ${ITEM.url}, ${ordem}, true)
    `
    console.log(`    item criado em "${grupo.titulo}": "${ITEM.titulo}" (ordem ${ordem})`)
  }
}

async function main() {
  if (dryRun) console.log("MODO DRY-RUN — nada será gravado\n")
  for (const b of DATABASES) {
    if (onlyDb && b.name !== onlyDb) continue
    if (!b.url) {
      console.log(`[${b.name}] sem DATABASE_URL definida — pulado`)
      continue
    }
    const pg = postgres(b.url, { max: 1 })
    try {
      await run(pg, b.name)
    } catch (e) {
      console.error(`[${b.name}] ERRO: ${e.message}`)
      process.exitCode = 1
    } finally {
      await pg.end({ timeout: 5 })
    }
  }
  console.log("\nConcluído.")
}

main()
