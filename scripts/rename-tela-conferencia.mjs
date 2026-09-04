import dotenv from "dotenv"
import postgres from "postgres"

dotenv.config({ path: ".env.local" })

const TARGETS = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

const OLD = "conferencia-op-tecelagem"
const NEW = "conferencia-op-tecido-cru"

async function run() {
  for (const { name, url } of TARGETS) {
    if (!url) {
      console.log(`[${name}] SEM_URL — pulando`)
      continue
    }
    const sql = postgres(url, { max: 1 })
    try {
      const rows = await sql`SELECT id, nome, telas FROM integracoes`
      let mudouRenome = 0
      for (const r of rows) {
        const atual = Array.isArray(r.telas) ? r.telas : []
        if (!atual.some((t) => String(t).includes(OLD))) continue
        const novo = atual.map((t) => (t === OLD ? NEW : t))
        await sql`
          UPDATE integracoes SET telas = ${JSON.stringify(novo)}::json, updated_at = now()
          WHERE id = ${r.id}`
        console.log(`[${name}] id=${r.id} ${r.nome}: telas ${JSON.stringify(atual)} -> ${JSON.stringify(novo)}`)
        mudouRenome++
      }
      if (mudouRenome === 0) console.log(`[${name}] nenhuma integração com a tela ${OLD}`)
    } catch (err) {
      console.error(`[${name}] ERRO:`, err.message)
    } finally {
      await sql.end()
    }
  }
}

run()