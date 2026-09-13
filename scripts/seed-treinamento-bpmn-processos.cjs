const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "seed-treinamento-bpmn-processos.sql"), "utf-8")

  try {
    await client.unsafe(sql)
    console.log("Lições BPMN/visual seeded successfully!")
    const licoes = await client`SELECT m.ordem, l.titulo, l.ordem AS ordem_licao
      FROM proc_treino_licoes l JOIN proc_treino_modulos m ON m.id = l.modulo_id
      WHERE m.ordem = 5 AND l.ordem >= 3 ORDER BY l.ordem`
    console.log(JSON.stringify(licoes, null, 2))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch((e) => { console.error(e); process.exit(1) })