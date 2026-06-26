import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_Dn0NLcVzOG9u@ep-delicate-dew-acaz6kqb-pooler.sa-east-1.aws.neon.tech/db_pmtprotextil?sslmode=require")

async function main() {
  console.log("=== Verificando status antes da migração ===")

  const cruBefore = await sql`SELECT status, COUNT(*) FROM produto_cru_amostra GROUP BY status ORDER BY status`
  console.log("produto_cru_amostra antes:", JSON.stringify(cruBefore, null, 2))

  const acabBefore = await sql`SELECT status, COUNT(*) FROM produto_cru_acabamento_amostra GROUP BY status ORDER BY status`
  console.log("produto_cru_acabamento_amostra antes:", JSON.stringify(acabBefore, null, 2))

  // Migrate APROVADO -> APROVADA_DESEN in both tables
  console.log("\n=== Migrando APROVADO → APROVADA_DESEN ===")

  const cruResult = await sql`
    UPDATE produto_cru_amostra
    SET status = 'APROVADA_DESEN'
    WHERE status = 'APROVADO'
    RETURNING id, status
  `
  console.log(`produto_cru_amostra atualizados: ${cruResult.length}`, cruResult.length > 0 ? JSON.stringify(cruResult, null, 2) : "")

  const acabResult = await sql`
    UPDATE produto_cru_acabamento_amostra
    SET status = 'APROVADA_DESEN'
    WHERE status = 'APROVADO'
    RETURNING id, status
  `
  console.log(`produto_cru_acabamento_amostra atualizados: ${acabResult.length}`, acabResult.length > 0 ? JSON.stringify(acabResult, null, 2) : "")

  console.log("\n=== Verificando status depois da migração ===")

  const cruAfter = await sql`SELECT status, COUNT(*) FROM produto_cru_amostra GROUP BY status ORDER BY status`
  console.log("produto_cru_amostra depois:", JSON.stringify(cruAfter, null, 2))

  const acabAfter = await sql`SELECT status, COUNT(*) FROM produto_cru_acabamento_amostra GROUP BY status ORDER BY status`
  console.log("produto_cru_acabamento_amostra depois:", JSON.stringify(acabAfter, null, 2))

  console.log("\n✅ Migração concluída!")
}

main().catch(console.error)
