const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      provider_account_id VARCHAR(100) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type VARCHAR(50),
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, provider_account_id)
    )
  `

  try {
    await client.unsafe(sql)
    console.log("Tabela 'accounts' criada com sucesso!")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
