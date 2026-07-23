const { execSync } = require("child_process")
const dotenv = require("dotenv")
const postgres = require("postgres")
const fs = require("fs")
const path = require("path")

dotenv.config({ path: ".env.local" })

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
]

async function runSqlFile(sql, filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  // Remove comment lines, then split by semicolons
  const cleaned = content
    .split("\n")
    .map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith("--")) return ""
      return line
    })
    .join("\n")

  const statements = cleaned
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt)
    } catch (e) {
      // Ignore "already exists" errors
      if (!e.message.includes("already exists") && !e.message.includes("já existe")) {
        console.log(`    ⚠️  ${e.message.split("\n")[0]}`)
      }
    }
  }
}

async function migrateDatabase(db) {
  console.log(`\n🔄 Migrando banco: ${db.name}`)
  const sql = postgres(db.url, { prepare: false })

  // Step 1: Apply Drizzle migrations directly
  console.log(`  📦 Aplicando Drizzle migrations...`)
  try {
    const migrationsDir = path.join(__dirname, "..", "src", "lib", "db", "migrations")

    // Create drizzle migrations tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL DEFAULT 0
      )
    `

    const applied = await sql`SELECT hash FROM __drizzle_migrations`
    const appliedHashes = new Set(applied.map(r => r.hash))

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    let count = 0
    for (const file of files) {
      const hash = file.replace('.sql', '')
      if (appliedHashes.has(hash)) continue

      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      const statements = content
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const stmt of statements) {
        try {
          await sql.unsafe(stmt)
        } catch (e) {
          // Ignore common idempotent errors
          if (!e.message.includes('already exists') && !e.message.includes('já existe') && !e.message.includes('does not exist')) {
            // silent
          }
        }
      }

      await sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`
      count++
    }
    console.log(`  ✅ ${count} Drizzle migrations processadas`)
  } catch (e) {
    console.log(`  ⚠️  Drizzle: ${e.message.split("\n")[0]}`)
  }

  // Step 2: Apply prerequisite SQL files (user_menus, etc.)
  console.log(`  🔧 Aplicando SQLs auxiliares...`)
  const sqlFiles = [
    path.join(__dirname, "add-user-menus.sql"),
    path.join(__dirname, "add-perfil-menus.sql"),
  ]
  for (const sqlFile of sqlFiles) {
    if (fs.existsSync(sqlFile)) {
      await runSqlFile(sql, sqlFile)
    }
  }
  console.log(`  ✅ SQLs auxiliares OK`)

  // Step 3: Run custom migrate.js via child process
  console.log(`  🔧 Rodando migração customizada...`)
  try {
    execSync("node scripts/migrate.js", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: db.url }
    })
    console.log(`  ✅ Migração customizada OK`)
  } catch (error) {
    const msg = error.stderr ? error.stderr.toString() : error.message
    const lastLine = msg.trim().split("\n").filter(l => l.includes("❌") || l.includes("Erro")).pop() || msg.trim().split("\n").pop()
    console.error(`  ❌ ${lastLine}`)
  }

  await sql.end()
  console.log(`✅ Banco ${db.name} finalizado!`)
}

async function migrateAll() {
  console.log("🚀 Iniciando migração para todos os bancos de dados...")

  for (const db of DATABASES) {
    if (!db.url) {
      console.log(`⚠️  URL não encontrada para ${db.name}, pulando...`)
      continue
    }
    await migrateDatabase(db)
  }

  console.log("\n✅ Migração concluída para todos os bancos!")
  process.exit(0)
}

migrateAll()