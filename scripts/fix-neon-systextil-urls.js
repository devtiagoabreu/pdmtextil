// Corrige as URLs das integrações Systêxtil que apontam para o caminho morto
// `/apexbd/systextil/...`. Esse caminho responde 404 tanto no token quanto nos
// endpoints; o caminho válido é `/apexbd/erp/...`.
//
// O bug entrou quando o neon foi populado com URLs antigas. Sem token nenhum proxy
// consegue chamar nada — a integração fica ativa no banco mas morta em produção.
//
// Idempotente: só reescreve o que ainda aponta para o caminho morto, e só grava
// depois de confirmar que token E endpoint respondem na URL nova.
//
// Roda nos 4 bancos (o problema hoje é só no neon, mas o script cobre todos).
//
// Uso:
//   node scripts/fix-neon-systextil-urls.js              (todos os bancos)
//   node scripts/fix-neon-systextil-urls.js --db=neon    (só um)
//   node scripts/fix-neon-systextil-urls.js --dry-run    (só diagnostica, não grava)
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

const DE = "/apexbd/systextil/"
const PARA = "/apexbd/erp/"

const args = process.argv.slice(2)
const onlyDb = (args.find((a) => a.startsWith("--db=")) || "").split("=")[1] || null
const dryRun = args.includes("--dry-run")

const trocar = (url) => (url && url.includes(DE) ? url.replace(DE, PARA) : url)

async function testarToken(tokenUrl, authConfig) {
  const body = new URLSearchParams()
  body.append("grant_type", authConfig.grant_type || "client_credentials")
  if (authConfig.scope) body.append("scope", authConfig.scope)
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${authConfig.client_id}:${authConfig.client_secret}`).toString("base64")}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  })
  if (!resp.ok) return { ok: false, detalhe: `HTTP ${resp.status}` }
  const { access_token } = await resp.json().catch(() => ({}))
  if (!access_token) return { ok: false, detalhe: "sem access_token" }
  return { ok: true, token: access_token }
}

async function testarEndpoint(baseUrl, token) {
  const resp = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  return { ok: resp.ok, detalhe: `HTTP ${resp.status}` }
}

async function corrigirDb({ name, url }) {
  if (!url) {
    console.log(`[${name}] URL ausente — pulando`)
    return
  }
  const sql = postgres(url, { max: 1 })
  try {
    const rows = await sql`
      SELECT id, nome, base_url, auth_config
        FROM integracoes
       WHERE ativo = true
         AND (base_url LIKE ${"%" + DE + "%"} OR auth_config->>'token_url' LIKE ${"%" + DE + "%"})
       ORDER BY id
    `

    if (!rows.length) {
      console.log(`[${name}] nenhuma integração no caminho morto`)
      return
    }

    for (const r of rows) {
      const authConfig = r.auth_config || {}
      const novoBase = trocar(r.base_url)
      const novoToken = trocar(authConfig.token_url)

      const t = await testarToken(novoToken, authConfig)
      if (!t.ok) {
        console.error(`[${name}] id=${r.id} ${r.nome} — token novo ainda falha (${t.detalhe}) — nada gravado`)
        continue
      }
      const e = await testarEndpoint(novoBase, t.token)
      if (!e.ok) {
        console.error(`[${name}] id=${r.id} ${r.nome} — endpoint novo ainda falha (${e.detalhe}) — nada gravado`)
        continue
      }

      const antes = `${r.base_url} / ${authConfig.token_url}`
      if (dryRun) {
        console.log(`[${name}] id=${r.id} ${r.nome} — OK, mudaria:`)
        console.log(`            de: ${antes}`)
        console.log(`            para: ${novoBase} / ${novoToken}`)
        continue
      }

      await sql`
        UPDATE integracoes
           SET base_url = ${novoBase},
               auth_config = ${sql.json({ ...authConfig, token_url: novoToken })},
               updated_at = now()
         WHERE id = ${r.id}
      `
      console.log(`[${name}] id=${r.id} ${r.nome} corrigido (token ${t.ok ? "OK" : "?"}, endpoint ${e.detalhe})`)
      console.log(`            de:   ${antes}`)
      console.log(`            para: ${novoBase} / ${novoToken}`)
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
    await corrigirDb(db)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
