const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  // Insert new amostra statuses
  const r1 = await client`
    INSERT INTO "status" (nome, rotulo, tipo, cor, ordem)
    VALUES
      ('EM_PRODUCAO_TEC', 'Em Produção Tecelagem', 'AMOSTRA', '#a855f7', 4),
      ('EM_PRODUCAO_BEN', 'Em Produção Beneficiamento', 'AMOSTRA', '#a855f7', 5),
      ('APROVADO_DESENVOLVIMENTO', 'Aprovado Desenvolvimento', 'AMOSTRA', '#14b8a6', 6),
      ('APROVADO_COMERCIAL', 'Aprovado Comercial', 'AMOSTRA', '#14b8a6', 7)
    ON CONFLICT (nome, tipo) DO NOTHING
    RETURNING nome
  `
  console.log("AMOSTRA statuses:", r1.map(r => r.nome))

  // Insert missing solicitação statuses
  const r2 = await client`
    INSERT INTO "status" (nome, rotulo, tipo, cor, ordem)
    VALUES
      ('PILOTAGEM', 'Pilotagem', 'SOLICITACAO_DESENVOLVIMENTO', '#a855f7', 7),
      ('CONCLUIDO_DEV', 'Concluído Desenvolvimento', 'SOLICITACAO_DESENVOLVIMENTO', '#22c55e', 9),
      ('APROVADO_CLI', 'Aprovado pelo Cliente', 'SOLICITACAO_DESENVOLVIMENTO', '#06b6d4', 10)
    ON CONFLICT (nome, tipo) DO NOTHING
    RETURNING nome
  `
  console.log("SOLICITACAO_DESENVOLVIMENTO statuses:", r2.map(r => r.nome))

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
