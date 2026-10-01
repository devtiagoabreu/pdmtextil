// Verifica o endpoint de relatório NF-e × CT-e (`api_rel_nfe_cte_periodo`) depois
// de mexer no SQL de docs/rel-nf-cte.sql.
//
// Faz o que a tela faz, para dar no console os mesmos números que o dashboard
// mostra: token OAuth2, pagina o relatório INTEIRO em blocos de 100 (acumulando os
// BRUTOS, porque os cálculos são por CT-e e não podem quebrar na divisao entre
// páginas), aplica o dedupe CT-e|NF-e e recalcula os derivados com as MESMAS
// fórmulas de src/app/(dashboard)/ferramentas/nfe-cte/components/utils.ts:
//   chave CT-e = cte_numero|cte_serie
//   dedupe     = CT-e|NF-e  (1ª ocorrência)
//   pct        = ROUND(cte_valor_total / soma_nf * 100, 2)
//   faixas     = <=1,5 verde | <=2,0 laranja | >2,0 vermelho
//   região     = 1ª nf_od_regiao preenchida do CT-e
//
// É READ-ONLY: só pede token e GET no endpoint.
//
// Uso:
//   node scripts/verificar-rel-nf-cte.js                  (pdm_textil)
//   node scripts/verificar-rel-nf-cte.js --db=pdm_pro_textil
//
// Sai com codigo 1 se alguma linha estiver fora da janela de dois meses ou se o
// endpoint responder erro - assim da para usar depois de publicar o SQL.
//
// Referencias: docs/rel-nf-cte.sql (SQL) e docs/rel-nfe-cte.md secao 23 (regra).
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const NOME = "api_rel_nfe_cte_periodo"
const PAGINA = 100
const MAX_PAGINAS = 40
// Mesmos limites de FRETE_PCT_MINIMO / FRETE_PCT_MAXIMO (components/utils.ts).
const FRETE_PCT_MINIMO = 1.5
const FRETE_PCT_MAXIMO = 2

const DATABASES = {
  pdm_textil: () => process.env.DATABASE_URL,
  pdm_pro_textil: () => process.env.DATABASE_URL_PDM_PRO_TEXTIL,
  pdm_ibirapuera: () => process.env.DATABASE_URL_PDM_IBIRAPUERA,
  neon: () => process.env.DATABASE_URL_NEON,
}

const args = process.argv.slice(2)
const argDb = args.find((a) => a.startsWith("--db="))
const dbName = argDb ? argDb.slice("--db=".length) : "pdm_textil"
if (!DATABASES[dbName]) {
  console.error(`--db invalido: ${dbName} (use ${Object.keys(DATABASES).join(" | ")})`)
  process.exit(1)
}
const dbUrl = DATABASES[dbName]()
if (!dbUrl) {
  console.error(`env var do banco ${dbName} ausente`)
  process.exit(1)
}

const n = (x) => { const v = Number(x); return Number.isFinite(v) ? v : 0 }
const arred2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100
const chaveCte = (l) => `${l.cte_numero ?? "?"}|${l.cte_serie ?? "?"}`
const chaveCteNf = (l) => `${chaveCte(l)}|${l.nf_numero ?? "?"}-${l.nf_serie ?? "?"}`
const regiaoDe = (ls) => {
  const r = ls.map((l) => l.nf_od_regiao).find((v) => v != null && String(v).trim() && String(v).trim() !== "-")
  return r ? String(r).trim() : "Sem região"
}
const dataDe = (l) => dt(l.nf_data) || dt(l.cte_data)

// "DD/MM/YYYY" -> Date em UTC. Aceita ISO tambem, por causa do TO_CHAR.
function dt(v) {
  if (!v) return null
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(v))
  if (br) return new Date(Date.UTC(+br[3], +br[2] - 1, +br[1]))
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}
const d2 = (d) => (d ? d.toISOString().slice(0, 10) : "?")

function extrairItens(corpo) {
  if (Array.isArray(corpo)) return corpo
  if (corpo && typeof corpo === "object") {
    for (const chave of ["items", "data", "rows", "result", "registros"]) {
      if (Array.isArray(corpo[chave])) return corpo[chave]
    }
  }
  return []
}

async function pegarToken(ac) {
  const body = new URLSearchParams({ grant_type: ac.grant_type || "client_credentials" })
  if (ac.scope) body.append("scope", ac.scope)
  const resp = await fetch(ac.token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${ac.client_id}:${ac.client_secret}`).toString("base64")}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(30000),
  })
  if (!resp.ok) throw new Error(`token OAuth2 -> HTTP ${resp.status}`)
  const token = (await resp.json()).access_token
  if (!token) throw new Error("token OAuth2 sem access_token")
  return token
}

async function lerIntegracao() {
  const sql = postgres(dbUrl, { max: 1 })
  try {
    const [cfg] = await sql`SELECT base_url, tipo_auth, auth_config FROM integracoes WHERE nome = ${NOME} LIMIT 1`
    return cfg || null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const cfg = await lerIntegracao()
  if (!cfg) throw new Error(`integracao ${NOME} nao encontrada em ${dbName}`)
  console.log(`banco ......... ${dbName}`)
  console.log(`endpoint ....... ${cfg.base_url}`)

  const token = await pegarToken(cfg.auth_config || {})
  const bruto = []
  for (let pagina = 0, offset = 0; pagina < MAX_PAGINAS; pagina++, offset += PAGINA) {
    const url = `${cfg.base_url}?limit=${PAGINA}&offset=${offset}`
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(60000),
    })
    if (!resp.ok) throw new Error(`endpoint -> HTTP ${resp.status} em offset ${offset}`)
    const itens = extrairItens(await resp.json().catch(() => null))
    bruto.push(...itens)
    console.log(`  pagina offset=${String(offset).padStart(4)}: ${itens.length} linha(s) (total ${bruto.length})`)
    if (itens.length < PAGINA) break
  }
  if (bruto.length === 0) throw new Error("endpoint devolveu 0 linhas")

  // Dedupe CT-e|NF-e e agrupamento por CT-e (1a ocorrencia da chave).
  const vistas = new Set()
  const linhas = []
  for (const l of bruto) {
    const k = chaveCteNf(l)
    if (vistas.has(k)) continue
    vistas.add(k)
    linhas.push(l)
  }
  const porCte = new Map()
  for (const l of linhas) {
    const k = chaveCte(l)
    if (!porCte.has(k)) porCte.set(k, [])
    porCte.get(k).push(l)
  }
  const somaNf = new Map()
  for (const [k, ls] of porCte) somaNf.set(k, ls.reduce((s, l) => s + n(l.nf_valor_total), 0))
  const pct = new Map()
  for (const [k, ls] of porCte) {
    const mercadoria = somaNf.get(k)
    pct.set(k, mercadoria > 0 ? arred2((n(ls[0].cte_valor_total) / mercadoria) * 100) : null)
  }

  console.log("\n=== 1. VOLUME ===")
  console.log(`linhas brutas .............. ${bruto.length}`)
  console.log(`linhas dedupe (CT-e|NF-e) .. ${linhas.length}  (duplicadas: ${bruto.length - linhas.length})`)
  console.log(`CT-es distintos ............ ${porCte.size}`)
  console.log(`CT-es com 2+ NF-e .......... ${[...porCte.values()].filter((ls) => ls.length > 1).length}`)

  console.log("\n=== 2. JANELA (esperado: mes anterior completo + mes atual completo) ===")
  const agora = new Date()
  const hoje = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())
  const esperadoDe = new Date(Date.UTC(new Date(hoje).getUTCFullYear(), new Date(hoje).getUTCMonth() - 1, 1))
  const esperadoAte = new Date(Date.UTC(new Date(hoje).getUTCFullYear(), new Date(hoje).getUTCMonth() + 1, 1))
  const datas = linhas.map(dataDe).filter(Boolean).sort((a, b) => a - b)
  console.log(`esperado ................. [${d2(esperadoDe)}, ${d2(esperadoAte)})`)
  console.log(`observado ................. [${d2(datas[0])}, ${d2(datas[datas.length - 1])}]`)
  const fora = datas.filter((d) => d < esperadoDe || d >= esperadoAte)
  console.log(fora.length === 0 ? "OK: nenhuma linha fora da janela" : `FALHA: ${fora.length} linha(s) fora da janela`)
  const porMes = new Map()
  for (const d of datas) {
    const k = d.toISOString().slice(0, 7)
    porMes.set(k, (porMes.get(k) || 0) + 1)
  }
  console.log("linhas por mes (nf_data): " + [...porMes].sort().map(([m, v]) => `${m}=${v}`).join("  "))

  console.log("\n=== 3. DADOS DO FRETE ===")
  const conta = (pred) => `${linhas.filter(pred).length}/${linhas.length}`
  console.log(`cte_valor_total > 0 ....... ${conta((l) => n(l.cte_valor_total) > 0)}  (numerador do dashboard)`)
  console.log(`cte_valor_frete > 0 ....... ${conta((l) => n(l.cte_valor_frete) > 0)}  (campo inutilizado de proposito)`)
  console.log(`nf_valor_total > 0 ........ ${conta((l) => n(l.nf_valor_total) > 0)}  (denominador)`)
  console.log(`CT-es sem pct calculavel .. ${[...pct.values()].filter((v) => v == null).length}/${porCte.size}`)

  console.log("\n=== 4. FRETE TOTAL (bug da secao 23.6) ===")
  const porLinha = linhas.reduce((s, l) => s + n(l.cte_valor_total), 0)
  const porCteTotal = [...porCte.values()].reduce((s, ls) => s + n(ls[0].cte_valor_total), 0)
  console.log(`soma por linha (BUG antigo) . R$ ${porLinha.toFixed(2)}`)
  console.log(`soma por CT-e  (CORRETO) ... R$ ${porCteTotal.toFixed(2)}`)
  console.log(`diferenca .................. R$ ${(porLinha - porCteTotal).toFixed(2)} (${porCteTotal ? (((porLinha - porCteTotal) / porCteTotal) * 100).toFixed(1) : "-"}%)`)
  if (porLinha === porCteTotal) console.log("(so aparece quando existe CT-e com 2+ NF-e)")

  console.log("\n=== 5. FAIXAS (limites inclusivos no topo) ===")
  const faixas = { abaixo: 0, na_faixa: 0, acima: 0 }
  for (const v of pct.values()) {
    if (v == null) continue
    if (v <= FRETE_PCT_MINIMO) faixas.abaixo++
    else if (v <= FRETE_PCT_MAXIMO) faixas.na_faixa++
    else faixas.acima++
  }
  const avaliados = faixas.abaixo + faixas.na_faixa + faixas.acima
  const pctDe = (v) => `${String(v).padStart(3)} (${avaliados ? ((v / avaliados) * 100).toFixed(0) : 0}%)`
  console.log(`<= ${FRETE_PCT_MINIMO}% ................. ${pctDe(faixas.abaixo)}`)
  console.log(`${FRETE_PCT_MINIMO}% a ${FRETE_PCT_MAXIMO}% ................. ${pctDe(faixas.na_faixa)}`)
  console.log(`> ${FRETE_PCT_MAXIMO}% .................. ${pctDe(faixas.acima)}`)
  console.log(`avaliados .................. ${avaliados}/${porCte.size}`)

  console.log("\n=== 6. REGIAO DO CLIENTE (nf_od_regiao) ===")
  const regs = new Map()
  for (const ls of porCte.values()) {
    const r = regiaoDe(ls)
    regs.set(r, (regs.get(r) || 0) + 1)
  }
  const comRegiao = [...porCte.values()].filter((ls) => regiaoDe(ls) !== "Sem região").length
  console.log(`CT-es com regiao ........... ${comRegiao}/${porCte.size}`)
  console.log(`rotulos distintos .......... ${regs.size}`)
  console.log("CT-es por regiao: " + [...regs].sort((a, b) => b[1] - a[1]).map(([r, v]) => `${r}=${v}`).join("  "))

  console.log("\n=== 7. TRANSPORTADORA: ratio agregado vs media por CT-e ===")
  const transp = new Map()
  for (const [k, ls] of porCte) {
    const achado = ls.find((l) => l.cte_transportadora_fantasia || l.cte_transportadora_razao)
    const nome = (achado && (achado.cte_transportadora_fantasia || achado.cte_transportadora_razao)) || "Sem transportadora"
    if (!transp.has(nome)) transp.set(nome, { ctes: 0, frete: 0, merc: 0, pcts: [], faixas: { abaixo: 0, na_faixa: 0, acima: 0 } })
    const g = transp.get(nome)
    g.ctes++
    g.frete += n(ls[0].cte_valor_total)
    g.merc += somaNf.get(k)
    const p = pct.get(k)
    if (p == null) continue
    g.pcts.push(p)
    if (p <= FRETE_PCT_MINIMO) g.faixas.abaixo++
    else if (p <= FRETE_PCT_MAXIMO) g.faixas.na_faixa++
    else g.faixas.acima++
  }
  console.log("transportadora | CT-es | S frete / S merc | media | <=1,5 | 1,5-2,0 | >2,0")
  for (const [nome, g] of [...transp].sort((a, b) => b[1].ctes - a[1].ctes)) {
    const media = g.pcts.length ? g.pcts.reduce((s, v) => s + v, 0) / g.pcts.length : null
    const ratio = g.merc > 0 ? (g.frete / g.merc) * 100 : null
    const f = (v, pad) => String(v).padStart(pad)
    console.log(
      `${nome.slice(0, 26).padEnd(26)} | ${f(g.ctes, 5)} | ${ratio == null ? f("-", 6) : f(`${ratio.toFixed(2)}%`, 6)} | ` +
      `${media == null ? "-" : `${media.toFixed(2)}%`} | ${f(g.faixas.abaixo, 5)} | ${f(g.faixas.na_faixa, 7)} | ${f(g.faixas.acima, 5)}`,
    )
  }

  if (fora.length > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error("\nERRO:", err.message)
  process.exit(1)
})