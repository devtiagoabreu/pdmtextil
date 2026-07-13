import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL)

const result = await sql`
  SELECT id, titulo, conteudo_md FROM crm_treino_licoes
  WHERE LOWER(conteudo_md) LIKE '%empresa%'
`

console.log("Lições com referência a 'empresa':")
for (const row of result) {
  console.log(`\n--- ID: ${row.id} | Título: ${row.titulo} ---`)
  // Find the lines that mention empresa
  const lines = row.conteudo_md.split("\n")
  for (const line of lines) {
    if (line.toLowerCase().includes("empresa")) {
      console.log("  >", line.trim())
    }
  }
}

if (result.length === 0) {
  console.log("Nenhuma lição encontrada com 'empresa' no conteúdo.")
}

process.exit(0)
