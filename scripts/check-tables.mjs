import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const envRaw = readFileSync(".env.local", "utf-8")
const match = envRaw.match(/^DATABASE_URL="(.+)"$/m)
const url = match[1]
const sql = neon(url)

// Verifica se a tabela accounts existe
const r = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name
`
console.log("Tabelas no banco:")
r.forEach(row => console.log(" -", row.table_name))

const a = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'accounts'
  ORDER BY ordinal_position
`
if (a.length > 0) {
  console.log("\nColunas da tabela accounts:")
  a.forEach(col => console.log(" -", col.column_name, col.data_type, col.is_nullable))
} else {
  console.log("\nTabela 'accounts' NAO EXISTE neste banco!")
}

// Verifica se o usuario existe
const u = await sql`SELECT id, email, role FROM usuarios WHERE email = ${"promodamarketing@gmail.com"}`
console.log("\nUsuario promodamarketing@gmail.com:", u.length > 0 ? JSON.stringify(u[0]) : "NAO ENCONTRADO")
