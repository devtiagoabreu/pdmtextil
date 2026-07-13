import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
const sql = neon(process.env.DATABASE_URL)

const licoes = await sql`SELECT id, modulo_id, titulo, conteudo_md, pre_requisitos FROM crm_treino_licoes ORDER BY modulo_id, ordem`

for (const l of licoes) {
  console.log(`\n/// ID:${l.id} | Mod:${l.modulo_id} | Tit:${l.titulo}`)
  if (l.pre_requisitos) console.log(`PRE: ${l.pre_requisitos}`)
  console.log(l.conteudo_md)
}
process.exit(0)
