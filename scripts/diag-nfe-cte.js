// Diagnóstico: conta campos nulos na resposta real de `api_rel_nfe_cte_periodo`.
// Reusa as credenciais OAuth2 já gravadas na tabela `integracoes` (não pede nada ao usuário).
//
// Uso:
//   node scripts/diag-nfe-cte.js
//   node scripts/diag-nfe-cte.js --db=pdm_textil --limiar=0     (mostra todas as linhas)
//   node scripts/diag-nfe-cte.js --amostra=3                   (3 linhas por CT-e)

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const NOME = "api_rel_nfe_cte_periodo"

const args = process.argv.slice(2)
const argValue = (f) => {
  const item = args.find((a) => a.startsWith(f + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const limiar = argValue("--limiar") ? Number(argValue("--limiar")) : 1
const amostra = Number(argValue("--amostra") || 2)

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
]

async function buscarIntegracao(url) {
  const sql = postgres(url, { max: 1 })
  try {
    const [row] = await sql`
      SELECT nome, base_url, tipo_auth, auth_config FROM integracoes
      WHERE nome = ${NOME} AND ativo = true LIMIT 1
    `
    return row || null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function tokenEBody(cfg) {
  const { client_id: id, client_secret: secret, grant_type: grant, scope, token_url: tokenUrl } =
    cfg.auth_config || {}
  const body = new URLSearchParams()
  body.append("grant_type", grant || "client_credentials")
  if (scope) body.append("scope", scope)

  const t = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: body.toString(),
  })
  if (!t.ok) throw new Error(`token -> HTTP ${t.status}`)
  const { access_token: token } = await t.json()

  const r = await fetch(cfg.base_url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  })
  if (!r.ok) throw new Error(`endpoint -> HTTP ${r.status}`)
  return r.json()
}

function itens(body) {
  if (Array.isArray(body)) return body
  if (body && typeof body === "object") {
    for (const c of ["items", "data", "rows", "result"]) {
      if (Array.isArray(body[c])) return body[c]
    }
  }
  return []
}

const vazio = (v) => v === null || v === undefined || v === ""

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES.slice(0, 1)
  for (const db of alvos) {
    if (!db.url) continue
    console.log(`\n=== ${db.name} ===`)
    const cfg = await buscarIntegracao(db.url)
    if (!cfg) {
      console.log(`[${db.name}] integração "${NOME}" não encontrada/ativa`)
      continue
    }
    let body
    try {
      body = await tokenEBody(cfg)
    } catch (e) {
      console.log(`[${db.name}] erro: ${e.message}`)
      continue
    }
    const lista = itens(body)
    console.log(`linhas: ${lista.length}`)
    if (!lista.length) continue

    const campos = [...new Set(lista.flatMap((l) => Object.keys(l)))]
    const contagem = campos
      .map((c) => {
        const preenchidas = lista.filter((l) => !vazio(l[c])).length
        return { campo: c, preenchidas, nulos: lista.length - preenchidas }
      })
      .filter((c) => c.nulos > 0 || c.preenchidas < lista.length)
      .sort((a, b) => b.nulos - a.nulos)

    console.log("\ncampo                       preenchidas   nulos")
    for (const c of contagem) {
      console.log(
        `${c.campo.padEnd(27)} ${String(c.preenchidas).padStart(10)} ${String(c.nulos).padStart(7)}`
      )
    }

    // Amostra de linhas com mais nulos
    const score = (l) => campos.filter((c) => vazio(l[c])).length
    const piores = [...lista].sort((a, b) => score(b) - score(a)).slice(0, amostra)
    console.log("\namostra:")
    for (const l of piores) {
      console.log(JSON.stringify(l))
    }
    if (limiar > 0) {
      const ruins = lista.filter((l) => score(l) >= limiar).length
      console.log(`\nlinhas com >= ${limiar} campo(s) nulo(s): ${ruins} de ${lista.length}`)
    }
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
