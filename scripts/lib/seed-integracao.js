// Utilitário compartilhado para registrar endpoints Systêxtil na tabela `integracoes`.
//
// Idempotente: só insere se ainda não existir um registro com o mesmo `nome`.
// Reutiliza as credenciais OAuth2 de uma integração Systêxtil já existente
// (por padrão `api_systextil_get_romaneios_pdm`) — não duplica segredos no código.
//
// Usado por scripts/seed-integracao-cte.js e scripts/seed-integracao-ordem-despacho.js.
//
// Flags comuns (ver parseSeedArgs):
//   --db=<nome>          roda só um banco
//   --forcar             reaplica base_url/telas/ativo em quem já existe
//   --verificar          testa token+endpoint antes de gravar
//   --origem=<nome>      integração de onde clonar as credenciais OAuth2
//   --fonte-db=<nome>    banco de onde clonar quando o banco alvo não tem a origem
//   --origem-db=<nome>   força clonar as credenciais deste banco (ignora a origem local)

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

// O app OAuth2 do PDM autentica com `Authorization: Basic base64(id:secret)`
// (mesmo formato de src/app/api/integracao/[id]/executar/route.ts), não com as
// credenciais no body — enviar no body devolve 401.
async function testarCredenciais(cfg, baseUrl) {
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

  const epResp = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!epResp.ok) return { ok: false, detalhe: `endpoint -> HTTP ${epResp.status}` }
  const corpo = await epResp.json().catch(() => null)
  const itens = Array.isArray(corpo) ? corpo : (corpo && (corpo.items || corpo.data || corpo.registros)) || []
  return { ok: true, detalhe: `token OK, endpoint OK (${itens.length} registro(s))` }
}

async function lerOrigem(url, nome) {
  const sql = postgres(url, { max: 1 })
  try {
    const [row] = await sql`SELECT nome, tipo_auth, auth_config FROM integracoes WHERE nome = ${nome} LIMIT 1`
    return row || null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function seedIntegracao({ nome, baseUrl, tela, origemCredenciais, fonteDb, origemDb, onlyDb, forcar, verificar }) {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  for (const db of alvos) {
    await seedDb(db, { nome, baseUrl, tela, origemCredenciais, fonteDb, origemDb, forcar, verificar })
  }
}

async function seedDb({ name, url }, opts) {
  if (!url) {
    console.log(`[${name}] URL ausente — pulando`)
    return
  }
  const { nome, baseUrl, tela, origemCredenciais, fonteDb, origemDb, forcar, verificar } = opts
  const sql = postgres(url, { max: 2 })
  try {
    let origem = null
    // --origem-db força puxar as credenciais de outro banco (ignora a origem local),
    // útil quando a origem local existe mas está com token_url quebrado.
    if (origemDb && origemDb !== name) {
      const fonte = DATABASES.find((d) => d.name === origemDb && d.url)
      if (fonte) {
        const remota = await lerOrigem(fonte.url, origemCredenciais)
        if (remota) {
          origem = { tipo_auth: remota.tipo_auth, auth_config: remota.auth_config }
          console.log(`[${name}] credenciais forçadas de ${fonte.name} (--origem-db)`)
        }
      }
    }
    if (!origem) {
      origem = (
        await sql`SELECT id, nome, tipo_auth, auth_config FROM integracoes WHERE nome = ${origemCredenciais} LIMIT 1`
      )[0]
    }

    // Banco alvo não tem a integração de origem (não foi populado ainda).
    // As chaves do app OAuth2 são as mesmas em todos os bancos, então clona de outro banco.
    if (!origem) {
      const fonte = DATABASES.find((d) => d.name === fonteDb && d.name !== name && d.url)
      if (fonte) {
        const remota = await lerOrigem(fonte.url, origemCredenciais)
        if (remota) {
          origem = { nome: remota.nome, tipo_auth: remota.tipo_auth, auth_config: remota.auth_config }
          console.log(`[${name}] sem "${origemCredenciais}" local — clonando as chaves de ${fonte.name}`)
        }
      }
    }

    if (!origem) {
      console.error(
        `[${name}] ⚠️ integração de origem "${origemCredenciais}" não encontrada (nem local, nem em ${fonteDb}) — configure as credenciais em Configurações > Integrações antes`
      )
      return
    }

    if (verificar) {
      const t = await testarCredenciais({ tipo_auth: origem.tipo_auth, auth_config: origem.auth_config }, baseUrl)
      console.log(`[${name}] verificação: ${t.detalhe}`)
      if (!t.ok) {
        console.error(`[${name}] ⚠️ credenciais não passaram na verificação — nada foi gravado`)
        return
      }
    }

    const [existente] = await sql`SELECT id, telas, ativo FROM integracoes WHERE nome = ${nome} LIMIT 1`

    if (existente) {
      if (!forcar) {
        console.log(`[${name}] já existe (id=${existente.id}) — nada a fazer`)
        return
      }
      await sql`
        UPDATE integracoes
        SET base_url = ${baseUrl},
            tipo_auth = ${origem.tipo_auth},
            auth_config = ${origem.auth_config},
            telas = ${sql.json([tela])},
            ativo = true,
            updated_at = now()
        WHERE id = ${existente.id}
      `
      console.log(`[${name}] atualizado (id=${existente.id})`)
      return
    }

    const [inserido] = await sql`
      INSERT INTO integracoes (nome, base_url, tipo_auth, auth_config, telas, ativo)
      VALUES (${nome}, ${baseUrl}, ${origem.tipo_auth}, ${origem.auth_config}, ${sql.json([tela])}, true)
      RETURNING id
    `
    console.log(`[${name}] criada (id=${inserido.id}, tela="${tela}")`)
  } catch (err) {
    console.error(`[${name}] erro:`, err.message)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

function parseSeedArgs(args) {
  const hasFlag = (flag) => args.includes(flag)
  const argValue = (flag) => {
    const item = args.find((a) => a.startsWith(flag + "="))
    return item ? item.split("=")[1] : null
  }
  return {
    onlyDb: argValue("--db"),
    forcar: hasFlag("--forcar"),
    verificar: hasFlag("--verificar"),
    origemCredenciais: argValue("--origem") || "api_systextil_get_romaneios_pdm",
    fonteDb: argValue("--fonte-db") || "pdm_textil",
    origemDb: argValue("--origem-db"),
  }
}

module.exports = { DATABASES, testarCredenciais, lerOrigem, seedIntegracao, parseSeedArgs }
