// Diagnóstico: por que as colunas NF_OD_* do relatório de CT-e (v3.1b) vêm vazias.
//
// Responde SEM rodar SQL no Oracle: baixa o payload dos dois endpoints
// publicados e refaz, em JS, exatamente o que o bloco `dsp` do SQL faz —
// chave `numero-serie`, `entrada_saida = 'Saida'`, `pedido > 0` e o corte de
// data. Se aqui casar e no Oracle não, o defeito está dentro do bloco `dsp`
// (filtro, tipo ou chave) e não na falta de dado.
//
// Atenção: `api_ordem_despacho` pagina em 100 e o `count` da resposta é o da
// PÁGINA, não o total. A primeira página traz 2022 — sem paginar, o cruzamento
// dá 0 e parece que a chave está errada.
//
// Uso:
//   node scripts/diag-despacho-cruzamento.js
//   node scripts/diag-despacho-cruzamento.js --db=neon
//   node scripts/diag-despacho-cruzamento.js --sem-sql=1   (só o cruzamento)

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const args = process.argv.slice(2)
const argValue = (f) => {
  const item = args.find((a) => a.startsWith(f + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const semSql = args.includes("--sem-sql=1")

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

async function integracao(url, nome) {
  const sql = postgres(url, { max: 1 })
  try {
    const [row] = await sql`
      SELECT base_url, auth_config FROM integracoes
      WHERE nome = ${nome} AND ativo = true LIMIT 1
    `
    return row || null
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function tokenDe(cfg) {
  const { client_id: id, client_secret: secret, grant_type: grant, scope, token_url: tokenUrl } =
    cfg.auth_config || {}
  const body = new URLSearchParams()
  body.append("grant_type", grant || "client_credentials")
  if (scope) body.append("scope", scope)
  const t = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: body.toString(),
  })
  if (!t.ok) throw new Error("token -> HTTP " + t.status)
  const { access_token } = await t.json()
  return access_token
}

async function get(url, token) {
  const r = await fetch(url, {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    signal: AbortSignal.timeout(180000),
  })
  if (!r.ok) throw new Error(url + " -> HTTP " + r.status)
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

const chaveNf = (n, s) => String(n).trim() + "-" + String(s).trim()

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES.slice(0, 1)
  for (const db of alvos) {
    if (!db.url) continue
    console.log("\n=== " + db.name + " ===")

    const cfgCte = await integracao(db.url, "api_rel_nfe_cte_periodo")
    const cfgOdp = await integracao(db.url, "api_ordem_despacho")
    if (!cfgCte) { console.log("api_rel_nfe_cte_periodo não encontrada/ativa"); continue }
    if (!cfgOdp) { console.log("api_ordem_despacho não encontrada/ativa"); continue }

    const rel = itens(await get(cfgCte.base_url, await tokenDe(cfgCte)))
    console.log("relatório: " + rel.length + " linhas")

    const odpToken = await tokenDe(cfgOdp)
    const p1 = await get(cfgOdp.base_url, odpToken)
    const odp = [...(p1.items || [])]
    let paginas = 1
    while (p1.hasMore && paginas < 2000) {
      const p = await get(cfgOdp.base_url + "?limit=1000&offset=" + odp.length, odpToken)
      if (!p.items || !p.items.length) break
      odp.push(...p.items)
      paginas++
      if (!p.hasMore) break
    }
    console.log("ordem de despacho: " + odp.length + " registros (" + paginas + " páginas)")

    const datas = odp.map((r) => r.data_movto).filter(Boolean).sort()
    console.log("data_movto: " + (datas[0] || "?") + " .. " + (datas[datas.length - 1] || "?"))

    const porNf = new Map()
    for (const r of odp) {
      const k = String(r.nf == null ? "" : r.nf).trim()
      if (!k) continue
      if (!porNf.has(k)) porNf.set(k, [])
      porNf.get(k).push(r)
    }

    const chavesRel = [...new Set(rel.map((l) => chaveNf(l.nf_numero, l.nf_serie)))]
    const casadas = chavesRel.filter((k) => porNf.has(k))
    console.log("\nchaves distintas: relatório " + chavesRel.length + " / despacho " + porNf.size)
    console.log("NFs do relatório que existem no despacho: " + casadas.length + " de " + chavesRel.length)

    // a escada de filtros do bloco `dsp`, na ordem do SQL
    const lim = new Date()
    lim.setMonth(lim.getMonth() - 3)
    let ok = 0
    const fora = { flag: [], pedido: [], data: [] }
    for (const k of casadas) {
      const rows = porNf.get(k)
      const comFlag = rows.filter((r) => String(r.entrada_saida).trim() === "Saida")
      if (!comFlag.length) { fora.flag.push(k); continue }
      const comPedido = comFlag.filter((r) => Number(r.pedido) > 0)
      if (!comPedido.length) { fora.pedido.push(k); continue }
      if (!comPedido.some((r) => String(r.data_movto) >= lim.toISOString())) { fora.data.push(k); continue }
      ok++
    }
    console.log("\nreproduzindo o bloco `dsp`:")
    console.log("  apos entrada_saida = 'Saida' : " + (casadas.length - fora.flag.length) + "  (caem " + fora.flag.length + ") " + fora.flag.slice(0, 6).join(" "))
    console.log("  apos pedido > 0              : " + (casadas.length - fora.flag.length - fora.pedido.length) + "  (caem " + fora.pedido.length + ") " + fora.pedido.slice(0, 6).join(" "))
    console.log("  apos data >= -3 meses         : " + ok + "  (caem " + fora.data.length + ") " + fora.data.slice(0, 6).join(" "))
    console.log("  => o SQL deveria preencher nf_od_pedido em " + ok + " linhas")

    if (!semSql && casadas.length) {
      const preenchidas = rel.filter((l) => l.nf_od_pedido != null).length
      console.log("\n  o endpoint publicado preencheu nf_od_pedido em " + preenchidas + " de " + rel.length + " linhas")
    }

    const k = casadas[0]
    if (k) {
      console.log("\nexemplo: " + k)
      for (const r of porNf.get(k).slice(0, 3)) {
        console.log("  despacho: " + JSON.stringify({
          nf: r.nf, pedido: r.pedido, data_movto: r.data_movto, valor_saida: r.valor_saida,
          fantasia: r.fantasia, cidade: r.cidade, romaneio: r.romaneio,
        }))
      }
    }
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
