const { neon } = require("@neondatabase/serverless")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") })

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const envios = await sql`SELECT * FROM email_enviados ORDER BY created_at DESC LIMIT 10`
  console.log("=== ENVIOS ===")
  if (envios.length === 0) {
    console.log("(vazio)")
  } else {
    console.log(JSON.stringify(envios, null, 2))
  }

  const cliques = await sql`
    SELECT ec.*, ee.email, ee.nome 
    FROM email_cliques ec 
    LEFT JOIN email_enviados ee ON ee.id = ec.envio_id 
    ORDER BY ec.clicked_at DESC LIMIT 20
  `
  console.log("\n=== CLIQUES ===")
  if (cliques.length === 0) {
    console.log("(vazio)")
  } else {
    console.log(JSON.stringify(cliques, null, 2))
  }

  process.exit(0)
}

main()
