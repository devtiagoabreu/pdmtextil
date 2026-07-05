const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  console.log("Buscando municípios da API do IBGE...")
  const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
  if (!res.ok) throw new Error("Falha ao buscar dados do IBGE: " + res.status)
  const municipios = await res.json()
  console.log(`Recebidos ${municipios.length} municípios do IBGE`)

  console.log("Carregando estados do banco...")
  const estados = await client`
    SELECT id, uf FROM crm_estados
  `
  const estadoMap = {}
  for (const e of estados) {
    estadoMap[e.uf] = e.id
  }
  console.log(`Carregados ${estados.length} estados`)

  const naoEncontrados = new Set()
  const cidades = municipios.map(m => {
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla
    const estadoId = estadoMap[uf]
    if (!estadoId) naoEncontrados.add(uf)
    return { nome: m.nome, estadoId }
  }).filter(c => c.estadoId)

  if (naoEncontrados.size > 0) {
    console.warn("UF não encontrados no banco:", [...naoEncontrados].join(", "))
  }

  console.log(`Limpando cidades existentes...`)
  await client`DELETE FROM crm_cidades`

  console.log(`Inserindo ${cidades.length} cidades...`)

  const BATCH = 500
  for (let i = 0; i < cidades.length; i += BATCH) {
    const batch = cidades.slice(i, i + BATCH)
    const placeholders = batch.map((_, idx) => `($${idx * 2 + 1}::varchar, $${idx * 2 + 2}::integer)`).join(",")
    const values = batch.flatMap(c => [c.nome, c.estadoId])
    await client.unsafe(
      `INSERT INTO crm_cidades (nome, estado_id) VALUES ${placeholders} ON CONFLICT (nome, estado_id) DO NOTHING`,
      values
    )
    if ((i + BATCH) % 2000 === 0 || i + BATCH >= cidades.length) {
      console.log(`  ${Math.min(i + BATCH, cidades.length)}/${cidades.length} inseridas`)
    }
  }

  console.log("Seed de cidades concluído com sucesso!")
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
