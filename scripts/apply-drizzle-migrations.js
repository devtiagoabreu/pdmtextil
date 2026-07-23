const postgres = require("postgres")
const dotenv = require("dotenv")
const fs = require("fs")
const path = require("path")

dotenv.config({ path: ".env.local" })

const MIGRATIONS_DIR = path.join(__dirname, "..", "src", "lib", "db", "migrations")

async function applyDrizzleMigrations(url, dbName) {
  console.log(`\n📦 Aplicando Drizzle migrations em: ${dbName}`)
  const sql = postgres(url, { prepare: false })

  try {
    // Create drizzle migrations tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL DEFAULT 0
      )
    `

    // Get list of already applied migrations
    const applied = await sql`SELECT hash FROM __drizzle_migrations`
    const appliedHashes = new Set(applied.map(r => r.hash))

    // Read migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    let appliedCount = 0

    for (const file of files) {
      const hash = file.replace('.sql', '')

      if (appliedHashes.has(hash)) {
        continue
      }

      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')

      // Split by statement-breakpoint and execute each statement
      const statements = content
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const stmt of statements) {
        try {
          await sql.unsafe(stmt)
        } catch (e) {
          // Ignore "already exists" errors
          if (!e.message.includes('already exists') && !e.message.includes('já existe')) {
            console.log(`  ⚠️  Aviso em ${file}: ${e.message.split('\n')[0]}`)
          }
        }
      }

      // Record migration as applied
      await sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`
      appliedCount++
      console.log(`  ✅ ${file}`)
    }

    if (appliedCount === 0) {
      console.log(`  ✅ Todas as migrations já aplicadas`)
    } else {
      console.log(`  ✅ ${appliedCount} migrations aplicadas`)
    }
  } catch (e) {
    console.error(`  ❌ Erro: ${e.message}`)
  }

  await sql.end()
}

async function main() {
  console.log("🚀 Aplicando Drizzle migrations...\n")

  await applyDrizzleMigrations(process.env.DATABASE_URL, "pdm_textil")
  await applyDrizzleMigrations(process.env.DATABASE_URL_PDM_PRO_TEXTIL, "pdm_pro_textil")
  await applyDrizzleMigrations(process.env.DATABASE_URL_PDM_IBIRAPUERA, "pdm_ibirapuera")

  console.log("\n✅ Drizzle migrations concluídas!")
}

main()