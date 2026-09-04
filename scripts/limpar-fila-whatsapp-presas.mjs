import dotenv from "dotenv"
import postgres from "postgres"

dotenv.config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

async function run() {
  const rows = await sql`
    UPDATE crm_whatsapp_fila
    SET status = 'CONCLUIDO', processado_em = now(), updated_at = now()
    WHERE status IN ('PENDENTE','PROCESSANDO')
      AND updated_at < now() - INTERVAL '10 minutes'
      AND (tentativas = 0 OR tentativas >= max_tentativas OR status = 'PROCESSANDO')
    RETURNING id, remote_jid, mensagem, status`
  console.log(`Atualizados: ${rows.length}`)
  for (const r of rows) console.log(r)
}

run().finally(() => sql.end())