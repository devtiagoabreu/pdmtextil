// Detalha a quebra: quem tem cabeçalho de NF-e e quem não tem, agrupado por transportadora/CNPJ.
// Uso: node scripts/diag-nfe-cte-quebra.js
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const NOME = "api_rel_nfe_cte_periodo"
const argValue = (f) => {
  const i = process.argv.find((a) => a.startsWith(f + "="))
  return i ? i.split("=")[1] : null
}
const onlyDb = argValue("--db")
const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
]

async function body(url) {
  const sql = postgres(url, { max: 1 })
  const [cfg] = await sql`SELECT nome, base_url, auth_config FROM integracoes WHERE nome=${NOME} AND ativo=true LIMIT 1`
  await sql.end({ timeout: 5 })
  if (!cfg) throw new Error("integração não encontrada")
  const { client_id: id, client_secret: s, grant_type: g, scope, token_url: t } = cfg.auth_config || {}
  const b = new URLSearchParams()
  b.append("grant_type", g || "client_credentials")
  if (scope) b.append("scope", scope)
  const tr = await fetch(t, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${s}`).toString("base64")}`,
    },
    body: b.toString(),
  })
  const { access_token: token } = await tr.json()
  const r = await fetch(cfg.base_url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  })
  const corpo = await r.json()
  return Array.isArray(corpo) ? corpo : corpo.items || corpo.data || []
}

async function main() {
  const db = (onlyDb ? DATABASES : DATABASES.slice(0, 1)).find((d) => d.name === (onlyDb || "pdm_textil") && d.url)
  const lista = await body(db.url)
  console.log(`linhas: ${lista.length}`)

  const temNf = (l) => l.nf_valor_total !== null && l.nf_valor_total !== undefined

  // 1. por transportadora
  const porTransp = new Map()
  for (const l of lista) {
    const k = l.cte_transportadora_fantasia || l.cte_transportadora_razao || "—"
    const e = porTransp.get(k) || { ok: 0, ko: 0, ctes: new Set(), nfs: new Set() }
    temNf(l) ? e.ok++ : e.ko++
    e.ctes.add(`${l.cte_numero}/${l.cte_serie}`)
    e.nfs.add(`${l.nf_numero}/${l.nf_serie}`)
    porTransp.set(k, e)
  }
  console.log("\n== por transportadora (ok = NF-e com valor) ==")
  for (const [k, e] of porTransp) {
    console.log(`${String(e.ok).padStart(4)} ok / ${String(e.ko).padStart(4)} sem  · ${e.ctes.size} CT-es · ${e.nfs.size} NFs · ${k}`)
  }

  // 2. faixa de numeração
  const ctes = [...new Set(lista.map((l) => l.cte_numero))].sort((a, b) => a - b)
  const okCtes = [...new Set(lista.filter(temNf).map((l) => l.cte_numero))].sort((a, b) => a - b)
  console.log(`\n== numeração ==\nCT-e total: ${ctes.length} (min ${ctes[0]} max ${ctes[ctes.length - 1]})\nCT-e com NF-e preenchida: ${okCtes.length} → ${okCtes.join(", ")}`)

  // 3. CT-es com mistura (alguma NF ok, outra não)
  const porCte = new Map()
  for (const l of lista) {
    const k = `${l.cte_numero}/${l.cte_serie}`
    const e = porCte.get(k) || { ok: 0, ko: 0 }
    temNf(l) ? e.ok++ : e.ko++
    porCte.set(k, e)
  }
  const mistos = [...porCte.entries()].filter(([, e]) => e.ok > 0 && e.ko > 0)
  console.log(`\nCT-es com mistura (parte ok, parte nulo): ${mistos.length}`)
  for (const [k, e] of mistos.slice(0, 10)) console.log(`  ${k}: ${e.ok} ok / ${e.ko} sem`)

  // 4. faixa de datas de emissão
  const datas = lista.map((l) => l.cte_data).filter(Boolean).sort()
  console.log(`\n== período do CT-e ==\n${datas[0]} .. ${datas[datas.length - 1]}`)

  // 5. NFs duplicadas entre CT-es
  const porNf = new Map()
  for (const l of lista) {
    const k = `${l.nf_numero}/${l.nf_serie}`
    porNf.set(k, (porNf.get(k) || 0) + 1)
  }
  const dup = [...porNf.entries()].filter(([, c]) => c > 1)
  console.log(`\nNFs em mais de um CT-e: ${dup.length} (${dup.slice(0, 8).map(([k, c]) => `${k}×${c}`).join(", ")})`)

  // 6. fornecedores distintos com/sem nome
  const comNome = new Set(lista.filter((l) => l.nf_fornecedor_razao).map((l) => l.nf_fornecedor_razao))
  const semNome = new Set(
    lista.filter((l) => !l.nf_fornecedor_razao).map((l) => `${l.nf_numero}/${l.nf_serie}`)
  )
  console.log(`\nfornecedores distintos com nome: ${comNome.size}`)
  console.log(`NFs sem nome de fornecedor: ${semNome.size} (ex.: ${[...semNome].slice(0, 10).join(", ")})`)

  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
