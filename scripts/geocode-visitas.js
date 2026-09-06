// Backfill de coordenadas de endereço (endereco_lat/endereco_lng) nas visitas CRM.
// Usa a mesma lógica da rota de cronograma: endereço da visita -> pessoa (empresa) -> cliente.
// Idempotente e resumível: só processa visitas onde endereco_lat/lng ainda são NULL.
//
// Uso:
//   node scripts/geocode-visitas.js                 (todas as DBs)
//   node scripts/geocode-visitas.js --db=pdm_textil  (só a principal)
//   node scripts/geocode-visitas.js --limit=50       (máx 50 por banco)
//   node scripts/geocode-visitas.js --dry-run        (só conta, não consulta o Nominatim)
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON).

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
const limit = Number(argValue("--limit") || 0)
const dryRun = args.includes("--dry-run")

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "pdm-textil/1.0 (backfill de coordenadas)"

const ESPACAMENTO_MS = 1100
const cacheCoords = new Map()
let fila = Promise.resolve()
function enfileirar(fn) {
  const executar = fila.then(fn)
  fila = executar
    .catch(() => null)
    .then(() => new Promise((r) => setTimeout(r, ESPACAMENTO_MS)))
  return executar
}

function montar(fields) {
  return [fields.endereco, fields.numero, fields.complemento, fields.bairro, fields.cidade, fields.uf]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .join(", ")
}

async function geocodificar(texto) {
  const chave = texto.trim().replace(/\s+/g, " ").toLowerCase()
  if (cacheCoords.has(chave)) return cacheCoords.get(chave)
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q", texto)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "br")
  let coords = null
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } })
    if (!res.ok) return null
    const data = await res.json()
    const item = Array.isArray(data) ? data[0] : null
    if (!item) return null
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    coords = { lat, lng }
  } catch {
    coords = null
  }
  cacheCoords.set(chave, coords)
  return coords
}

async function processarBanco(dbInfo) {
  const { name, url } = dbInfo
  if (!url) {
    console.log(`⚠️  ${name}: URL não configurada, pulando`)
    return
  }
  const sql = postgres(url, { prepare: false })
  try {
    const rows = await sql`
      SELECT v.id,
             v.endereco, v.numero, v.complemento, v.bairro, v.cidade, v.uf,
             v.empresa_id, v.cliente_id,
             p.endereco AS p_endereco, p.numero AS p_numero, p.complemento AS p_complemento,
             p.bairro AS p_bairro, p.cidade AS p_cidade, p.uf AS p_uf,
             c.endereco AS c_endereco, c.cidade AS c_cidade, c.uf AS c_uf
      FROM crm_visitas v
      LEFT JOIN crm_pessoas p ON p.id = v.empresa_id
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.endereco_lat IS NULL AND v.endereco_lng IS NULL
      ORDER BY v.id
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `

    console.log(`🔄 ${name}: ${rows.length} visita(s) sem coordenadas de endereço`)

    if (dryRun) {
      console.log(`   (dry-run: não será feita nenhuma geocodificação)`)
      return
    }

    let ok = 0
    let semResultado = 0
    let erro = 0

    for (const row of rows) {
      const enderecoTexto =
        montar({
          endereco: row.endereco,
          numero: row.numero,
          complemento: row.complemento,
          bairro: row.bairro,
          cidade: row.cidade,
          uf: row.uf,
        }) ||
        montar({
          endereco: row.p_endereco,
          numero: row.p_numero,
          complemento: row.p_complemento,
          bairro: row.p_bairro,
          cidade: row.p_cidade,
          uf: row.p_uf,
        }) ||
        montar({
          endereco: row.c_endereco,
          cidade: row.c_cidade,
          uf: row.c_uf,
        })

      if (!enderecoTexto || enderecoTexto.trim().length < 10) {
        semResultado++
        continue
      }

      const coords = await enfileirar(() => geocodificar(enderecoTexto))
      if (!coords) {
        semResultado++
        continue
      }

      try {
        await sql`UPDATE crm_visitas SET endereco_lat = ${coords.lat}, endereco_lng = ${coords.lng} WHERE id = ${row.id}`
        ok++
      } catch {
        erro++
      }
    }

    console.log(`   ✅ ${ok} atualizada(s) | sem endereço/resultado: ${semResultado} | erro: ${erro}`)
  } catch (e) {
    console.error(`   ❌ ${name}: ${e.message.split("\n")[0]}`)
  } finally {
    await sql.end()
  }
}

async function main() {
  console.log("🚀 Backfill de coordenadas de endereço nas visitas CRM")
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  if (alvos.length === 0) {
    console.error(`❌ Banco "${onlyDb}" não encontrado. Opções: ${DATABASES.map((d) => d.name).join(", ")}`)
    process.exit(1)
  }
  for (const db of alvos) {
    await processarBanco(db)
  }
  console.log("\n✅ Backfill concluído")
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})