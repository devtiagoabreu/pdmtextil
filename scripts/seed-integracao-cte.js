// Registra o endpoint de relatório NF-e → CT-e na tabela `integracoes`.
// Idempotente: só insere se ainda não existir um registro com o mesmo `nome`.
// Reutiliza as credenciais OAuth2 de uma integração Systêxtil já existente
// (por padrão `api_systextil_get_romaneios_pdm`) — não duplica segredos no código.
//
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   node scripts/seed-integracao-cte.js                 (todos os bancos)
//   node scripts/seed-integracao-cte.js --db=pdm_textil (só o principal)
//   node scripts/seed-integracao-cte.js --forcar        (reaplica telas/ativo)
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
function hasFlag(flag) {
  return args.includes(flag)
}
function argValue(flag) {
  const item = args.find((a) => a.startsWith(flag + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const forcar = hasFlag("--forcar")

const NOME = "api_rel_nfe_cte_periodo"
const BASE_URL =
  "https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_rel_nfe_cte_periodo"
const TELA = "nfe-cte"
const ORIGEM_CREDENCIAIS = argValue("--origem") || "api_systextil_get_romaneios_pdm"

async function seedDb(name, url) {
  if (!url) {
    console.log(`[${name}] URL ausente — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    const [origem] = await sql`
      SELECT id, nome, tipo_auth, auth_config
      FROM integracoes
      WHERE nome = ${ORIGEM_CREDENCIAIS}
      LIMIT 1
    `

    if (!origem) {
      console.error(
        `[${name}] ⚠️ integração de origem "${ORIGEM_CREDENCIAIS}" não encontrada — configure as credenciais em Configurações > Integrações antes`
      )
      return
    }

    const [existente] = await sql`SELECT id, telas, ativo FROM integracoes WHERE nome = ${NOME} LIMIT 1`

    if (existente) {
      if (!forcar) {
        console.log(`[${name}] já existe (id=${existente.id}) — nada a fazer`)
        return
      }
      await sql`
        UPDATE integracoes
        SET base_url = ${BASE_URL},
            tipo_auth = ${origem.tipo_auth},
            auth_config = ${origem.auth_config},
            telas = ${JSON.stringify([TELA])},
            ativo = true,
            updated_at = now()
        WHERE id = ${existente.id}
      `
      console.log(`[${name}] atualizado (id=${existente.id})`)
      return
    }

    const [inserido] = await sql`
      INSERT INTO integracoes (nome, base_url, tipo_auth, auth_config, telas, ativo)
      VALUES (${NOME}, ${BASE_URL}, ${origem.tipo_auth}, ${origem.auth_config}, ${JSON.stringify([TELA])}, true)
      RETURNING id
    `
    console.log(`[${name}] criada (id=${inserido.id}, tela="${TELA}")`)
  } catch (err) {
    console.error(`[${name}] erro:`, err.message)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  for (const db of alvos) {
    await seedDb(db.name, db.url)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
