const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envPath = path.join(__dirname, "..", ".env.local")
const match = fs.readFileSync(envPath, "utf-8").match(/^DATABASE_URL="(.+)"$/m)
const sql = postgres(match[1], { prepare: false });

(async () => {
  const tipos = await sql`SELECT DISTINCT tipo FROM logs ORDER BY tipo`
  console.log("Tipos:", tipos.map(t => t.tipo))
  
  const acoes = await sql`SELECT DISTINCT acao FROM logs WHERE acao IS NOT NULL ORDER BY acao`
  console.log("Ações:", acoes.map(a => a.acao))
  
  const entidades = await sql`SELECT DISTINCT entidade FROM logs WHERE entidade IS NOT NULL ORDER BY entidade`
  console.log("Entidades:", entidades.map(e => e.entidade))
  
  const userCount = await sql`SELECT usuario_nome, COUNT(*)::int as qt FROM logs GROUP BY usuario_nome ORDER BY qt DESC`
  console.log("Por usuário:")
  userCount.forEach(u => console.log(`  ${u.usuario_nome || "(null)"}: ${u.qt}`))

  const count = await sql`SELECT COUNT(*)::int as total FROM logs`
  console.log("Total logs:", count[0].total)

  await sql.end()
})()
