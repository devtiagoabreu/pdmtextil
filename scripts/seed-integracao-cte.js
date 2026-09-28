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
//   node scripts/seed-integracao-cte.js --verificar      (testa as credenciais na API antes de gravar)
//   node scripts/seed-integracao-cte.js --fonte-db=neon  (de onde clonar as chaves, quando o banco alvo não tem integração de origem)
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
const verificar = hasFlag("--verificar")

const NOME = "api_rel_nfe_cte_periodo"
const BASE_URL =
  "https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_rel_nfe_cte_periodo"
const TELA = "nfe-cte"
const ORIGEM_CREDENCIAIS = argValue("--origem") || "api_systextil_get_romaneios_pdm"
// Banco de onde clonar as chaves quando o banco alvo não tem integração de origem.
const fonteDb = argValue("--fonte-db") || "pdm_textil"

// O app OAuth2 do PDM autentica com `Authorization: Basic base64(id:secret)`
// (mesmo formato de src/app/api/integracao/[id]/executar/route.ts), não com as
// credenciais no body — enviar no body devolve 401.
async function testarCredenciais(cfg) {
  if (cfg.tipo_auth !== "oauth2") return { ok: true, detalhe: `tipo ${cfg.tipo_auth} (não testado)` }
  const { client_id: clientId, client_secret: clientSecret, grant_type: grant, scope, token_url: tokenUrl } = cfg.auth_config || {}
  if (!tokenUrl || !clientId || !clientSecret) return { ok: false, detalhe: "auth_config sem token_url/client_id/client_secret" }

  const body = new URLSearchParams()
  body.append("grant_type", grant || "client_credentials")
  if (scope) body.append("scope", scope)

  const tokenResp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: body.toString(),
  })
  if (!tokenResp.ok) return { ok: false, detalhe: `token OAuth2 -> HTTP ${tokenResp.status}` }
  const { access_token: accessToken } = await tokenResp.json().catch(() => ({}))
  if (!accessToken) return { ok: false, detalhe: "token OAuth2 sem access_token" }

  const epResp = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (!epResp.ok) return { ok: false, detalhe: `endpoint -> HTTP ${epResp.status}` }
  const corpo = await epResp.json().catch(() => null)
  const itens = Array.isArray(corpo) ? corpo : (corpo && (corpo.items || corpo.data || corpo.registros)) || []
  const ctes = new Set(itens.map((i) => `${i.cte_numero ?? i.CTE_NUMERO}`))
  return { ok: true, detalhe: `token OK, endpoint OK (${itens.length} NF-e, ${ctes.size} CT-e)` }
}

async function lerOrigem(alvo) {
  const sql = postgres(alvo.url, { max: 1 })
  try {
    const [row] = await sql`
      SELECT nome, tipo_auth, auth_config FROM integracoes
      WHERE nome = ${ORIGEM_CREDENCIAIS} LIMIT 1
    `
    return row || null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function seedDb(name, url) {
  if (!url) {
    console.log(`[${name}] URL ausente — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    let origem = (
      await sql`
        SELECT id, nome, tipo_auth, auth_config
        FROM integracoes
        WHERE nome = ${ORIGEM_CREDENCIAIS}
        LIMIT 1
      `
    )[0]

    // Banco alvo não tem a integração de origem (não foi populado ainda).
    // As chaves do app OAuth2 são as mesmas em todos os bancos, então clona de outro banco.
    if (!origem) {
      const fonte = DATABASES.find((d) => d.name === fonteDb && d.name !== name && d.url)
      if (fonte) {
        const remota = await lerOrigem(fonte)
        if (remota) {
          origem = { nome: remota.nome, tipo_auth: remota.tipo_auth, auth_config: remota.auth_config }
          console.log(`[${name}] sem "${ORIGEM_CREDENCIAIS}" local — clonando as chaves de ${fonte.name}`)
        }
      }
    }

    if (!origem) {
      console.error(
        `[${name}] ⚠️ integração de origem "${ORIGEM_CREDENCIAIS}" não encontrada (nem local, nem em ${fonteDb}) — configure as credenciais em Configurações > Integrações antes`
      )
      return
    }

    if (verificar) {
      const t = await testarCredenciais(origem)
      console.log(`[${name}] verificação: ${t.detalhe}`)
      if (!t.ok) {
        console.error(`[${name}] ⚠️ credenciais não passaram na verificação — nada foi gravado`)
        return
      }
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
