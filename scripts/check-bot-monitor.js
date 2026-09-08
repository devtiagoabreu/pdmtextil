// Consulta rápida dos logs de flow do bot WhatsApp no banco principal.
// Uso: node scripts/check-bot-monitor.js [--limit=20]
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const sql = postgres(process.env.DATABASE_URL, { max: 2 })

const args = process.argv.slice(2)
const limitArg = args.find((a) => a.startsWith("--limit="))
const limit = Number(limitArg ? limitArg.split("=")[1] : 20)

async function main() {
  const table = "crm_whatsapp_flow_logs"
  const hasTable = await sql`SELECT to_regclass('crm_whatsapp_flow_logs') IS NOT NULL AS ok`
  if (!hasTable[0]?.ok) {
    console.log("Tabela crm_whatsapp_flow_logs nao existe no banco principal")
    return
  }

  const total = await sql`SELECT COUNT(*)::int AS n FROM crm_whatsapp_flow_logs`
  console.log("Total de steps registrados:", total[0].n)

  const pinfo = await sql`
    SELECT
      MIN(created_at) AS primeiro, MAX(created_at) AS ultimo,
      COUNT(DISTINCT execution_id)::int AS execucoes,
      COUNT(*) FILTER (WHERE status = 'error')::int AS erros,
      COUNT(*) FILTER (WHERE status = 'success')::int AS sucessos,
      COUNT(*) FILTER (WHERE status = 'ignored')::int AS ignorados
    FROM crm_whatsapp_flow_logs`
  console.log(pinfo[0])

  const byStep = await sql`
    SELECT step, status, COUNT(*)::int AS n, ROUND(AVG(duration_ms))::int AS avg_ms
    FROM crm_whatsapp_flow_logs
    GROUP BY step, status ORDER BY step`
  console.log("Steps:", byStep.map((r) => `${r.step}=${r.status}(${r.n}${r.avg_ms ? ", " + r.avg_ms + "ms" : ""})`).join(" | "))

  const recentExecs = await sql`
    SELECT execution_id, remote_jid, push_name,
           MIN(created_at) AS started_at,
           COUNT(*)::int AS steps,
           COUNT(*) FILTER (WHERE status = 'error')::int AS erros
    FROM crm_whatsapp_flow_logs
    GROUP BY execution_id, remote_jid, push_name
    ORDER BY started_at DESC
    LIMIT ${limit}`

  console.log(`\nUltimas ${recentExecs.length} execucoes:`)
  for (const e of recentExecs) {
    console.log(
      `  ${e.started_at} | ${e.push_name || "?"} (${String(e.remote_jid || "").replace(/@s\.whatsapp\.net$/, "")}) | ${e.steps} steps | erros=${e.erros}`
    )
  }

  const recentErrors = await sql`
    SELECT execution_id, step, status, LEFT(error, 200) AS err, created_at
    FROM crm_whatsapp_flow_logs
    WHERE status = 'error'
    ORDER BY created_at DESC LIMIT 10`
  console.log(`\nUltimos erros (${recentErrors.length}):`)
  for (const e of recentErrors) {
    console.log(`  ${e.created_at} | ${e.step}: ${e.err}`)
  }

  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})