import postgres from "postgres"

const sql = postgres("postgresql://postgres:dqgh3ffrdg@94550ac37bb5.sn.mynetname.net:21237/pdm_textil", { prepare: false })

try {
  await sql`ALTER TABLE crm_contatos ALTER COLUMN empresa_id DROP NOT NULL`
  console.log("OK: empresa_id nullable")
} catch (e) {
  if (e.message.includes("does not exist")) console.log("SKIP: empresa_id already nullable")
  else throw e
}

try {
  await sql`ALTER TABLE crm_contatos ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)`
  console.log("OK: cliente_id added")
} catch (e) {
  if (e.message.includes("already exists")) console.log("SKIP: cliente_id already exists")
  else throw e
}

await sql.end()
console.log("Migration complete")
