// Sync do campo setor -> area_id (FK proc_areas) nas tabelas de ativos.
//
// Idempotente e resumível. Roda nos 4 bancos (pdm_textil, pdm_pro_textil,
// pdm_ibirapuera, neon).
//
// O que faz por banco:
//   1. Garante empresa "Pro Moda Têxtil" + site "Ativos e Vistorias" no módulo
//      de Processos (cria se não existirem — necessários para o FK funcionar).
//   2. Garante as 7 áreas do site de ativos (Segurança, Mecânica, Elétrica,
//      Ambiental, Predial, Logística, Administrativo).
//   3. Adiciona area_id em ativos_categorias e ativos_tipos_vistoria se faltar
//      (idempotente, com o mesmo FK do schema).
//   4. Mapeia o valor antigo `setor` para a área correspondente por nome.
//   5. Quando todas as linhas têm area_id, define NOT NULL e remove o campo
//      `setor` (conservador: se sobrar alguma linha sem mapeamento, mantém).
//
// Uso:
//   node scripts/sync-ativos-areas.js                    (todos os bancos)
//   node scripts/sync-ativos-areas.js --db=pdm_textil    (só um)
//
// Requer as env vars do .env.local.

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

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

const EMPRESA = "Pro Moda Têxtil"
const SITE = "Ativos e Vistorias"

const AREAS = [
  { nome: "Segurança", setor: "SEGURANCA" },
  { nome: "Mecânica", setor: "MECANICA" },
  { nome: "Elétrica", setor: "ELETRICA" },
  { nome: "Ambiental", setor: "AMBIENTAL" },
  { nome: "Predial", setor: "PREDIAL" },
  { nome: "Logística", setor: "LOGISTICA" },
  { nome: "Administrativo", setor: "ADMINISTRATIVO" },
]

function normalize(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

const TABELAS = [
  { tabela: "ativos_categorias", coluna: "area_id" },
  { tabela: "ativos_tipos_vistoria", coluna: "area_id" },
]

async function ensureSiteAndAreas(sql) {
  let empresaId
  const [emp] = await sql`SELECT id FROM proc_empresas WHERE nome = ${EMPRESA} LIMIT 1`
  if (emp) {
    empresaId = emp.id
  } else {
    const [criada] = await sql`INSERT INTO proc_empresas (nome) VALUES (${EMPRESA}) RETURNING id`
    empresaId = criada.id
    console.log(`    → empresa "${EMPRESA}" criada`)
  }

  let siteId
  const [site] = await sql`SELECT id FROM proc_sites WHERE nome = ${SITE} AND empresa_id = ${empresaId} LIMIT 1`
  if (site) {
    siteId = site.id
  } else {
    const [criado] = await sql`INSERT INTO proc_sites (empresa_id, nome) VALUES (${empresaId}, ${SITE}) RETURNING id`
    siteId = criado.id
    console.log(`    → site "${SITE}" criado`)
  }

  let areasCriadas = 0
  for (const a of AREAS) {
    const [exist] = await sql`SELECT id FROM proc_areas WHERE site_id = ${siteId} AND nome = ${a.nome} LIMIT 1`
    if (!exist) {
      await sql`INSERT INTO proc_areas (site_id, nome) VALUES (${siteId}, ${a.nome})`
      areasCriadas++
    }
  }
  if (areasCriadas > 0) console.log(`    → ${areasCriadas} área(s) do site de ativos criada(s)`)

  const areas = await sql`
    SELECT id, nome FROM proc_areas
    WHERE site_id = ${siteId}
      AND nome = ANY(${AREAS.map((a) => a.nome)})
  `
  return new Map(areas.map((a) => [normalize(a.nome), a.id]))
}

async function ensureAreaColumn(sql, tabela) {
  const colunas = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = ${tabela} AND column_name = 'area_id'
  `
  if (colunas.length > 0) return

  await sql.unsafe(
    `ALTER TABLE "${tabela}" ADD COLUMN area_id INTEGER REFERENCES proc_areas(id) ON DELETE NO ACTION`
  )
  console.log(`    → coluna area_id adicionada em ${tabela}`)
}

async function mapSetorPorNome(sql, tabela, areasById) {
  const linhas = await sql`SELECT id, setor, area_id FROM ${sql(tabela)}`
  let mapeadas = 0
  let semMap = 0
  for (const linha of linhas) {
    const areaId = areasById.get(normalize(linha.setor))
    if (areaId == null || linha.area_id === areaId) {
      if (areaId == null && linha.area_id == null) semMap++
      continue
    }
    await sql`UPDATE ${sql(tabela)} SET area_id = ${areaId}, updated_at = now() WHERE id = ${linha.id}`
    mapeadas++
  }
  return { mapeadas, semMap }
}

async function finalizarColuna(sql, tabela) {
  const [semArea] = await sql`SELECT COUNT(*)::int AS n FROM ${sql(tabela)} WHERE area_id IS NULL`
  if (semArea.n > 0) {
    console.log(`  [${tabela}] ${semArea.n} linha(s) sem area_id — mantendo coluna setor`)
    return
  }
  await sql.unsafe(`ALTER TABLE "${tabela}" ALTER COLUMN area_id SET NOT NULL`)
  await sql.unsafe(`ALTER TABLE "${tabela}" DROP COLUMN IF EXISTS setor`)
  console.log(`  [${tabela}] area_id NOT NULL definido e setor removido ✓`)
}

async function syncDb({ name, url }) {
  if (!url) {
    console.log(`[${name}] SEM_URL — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    console.log(`\n[${name}] garantindo site/áreas de Ativos e Vistorias`)
    const areasById = await ensureSiteAndAreas(sql)

    for (const { tabela } of TABELAS) {
      await ensureAreaColumn(sql, tabela)
      const { mapeadas, semMap } = await mapSetorPorNome(sql, tabela, areasById)
      if (mapeadas > 0) console.log(`  [${tabela}] ${mapeadas} linha(s) mapeadas setor → area_id`)
      if (semMap > 0) console.log(`  [${tabela}] ⚠️ ${semMap} linha(s) sem área correspondente`)
      await finalizarColuna(sql, tabela)
    }
  } catch (err) {
    console.error(`[${name}] erro:`, err.message)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  for (const db of alvos) {
    await syncDb(db)
  }
  console.log("\nDone!")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})