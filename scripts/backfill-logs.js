const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m)
const sql = postgres(dbUrlMatch[1], { prepare: false })

;(async () => {
  const count = await sql`SELECT COUNT(*)::int AS total FROM logs`
  console.log("Total logs:", count[0].total)

  if (count[0].total === 0) {
    console.log("Criando logs de LOGIN para usuarios existentes...")
    const usuarios = await sql`SELECT id, name, ultimo_acesso FROM usuarios WHERE ultimo_acesso IS NOT NULL`
    console.log(`Usuarios com ultimo_acesso: ${usuarios.length}`)

    for (const u of usuarios) {
      await sql`
        INSERT INTO logs (tipo, acao, descricao, entidade, entidade_id, usuario_nome, created_at)
        VALUES ('LOGIN', 'logar', 'Login realizado', 'Usuario', ${u.id}, ${u.name}, ${u.ultimo_acesso.toISOString()})
      `
    }
    console.log(`Inseridos ${usuarios.length} logs de LOGIN`)

    const users = await sql`SELECT id, name FROM usuarios`
    console.log(`Criando logs de CADASTRO para ${users.length} usuarios...`)
    for (const u of users) {
      await sql`
        INSERT INTO logs (tipo, acao, descricao, entidade, entidade_id, usuario_nome)
        VALUES ('CADASTRO', 'cadastrar', 'Usuario cadastrado no sistema', 'Usuario', ${u.id}, ${u.name})
      `
    }
    console.log(`Inseridos ${users.length} logs de CADASTRO`)
  }

  const finalCount = await sql`SELECT COUNT(*)::int AS total FROM logs`
  console.log("Total logs apos backfill:", finalCount[0].total)

  await sql.end()
})()
