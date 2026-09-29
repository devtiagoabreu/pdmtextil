// Sonda read-only: chama um endpoint Systêxtil e imprime a forma da resposta (chaves + 1 amostra).
// Uso: node scripts/diag-systextil-endpoint.js --nome=api_systextil_get_romaneios_pdm [--n=1]
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const argValue = (f) => {
  const i = process.argv.find((a) => a.startsWith(f + "="))
  return i ? i.split("=")[1] : null
}
const nome = argValue("--nome")
const extras = process.argv.filter((a) => a.startsWith("--q=")).map((a) => a.slice(4))
if (!nome) {
  console.error("informe --nome=<integração>")
  process.exit(1)
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 })
  const [cfg] = await sql`SELECT nome, base_url, auth_config FROM integracoes WHERE nome=${nome} LIMIT 1`
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

  const url = new URL(cfg.base_url)
  for (const q of extras) {
    const [k, v] = q.split("=")
    url.searchParams.set(k, v)
  }
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  })
  console.log(`${r.status} ${url.toString()}`)
  const corpo = await r.json().catch(() => null)
  const lista = Array.isArray(corpo) ? corpo : corpo?.items || corpo?.data || []
  console.log(`itens: ${Array.isArray(lista) ? lista.length : "?"}`)
  if (Array.isArray(lista) && lista.length) {
    console.log(`chaves: ${Object.keys(lista[0]).join(", ")}`)
    console.log(JSON.stringify(lista[0], null, 2))
  } else {
    console.log(JSON.stringify(corpo).slice(0, 1500))
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
