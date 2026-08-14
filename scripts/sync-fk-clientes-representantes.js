require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

const TARGETS = [
  { name: 'pdm_textil', url: process.env.DATABASE_URL },
  { name: 'pdm_pro_textil', url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: 'pdm_ibirapuera', url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: 'neon', url: process.env.DATABASE_URL_NEON },
]

const FKS = [
  {
    constraint: 'clientes_representantes_cliente_id_fkey',
    table: 'clientes_representantes',
    column: 'cliente_id',
    toTable: 'clientes',
    toCol: 'id',
  },
  {
    constraint: 'clientes_representantes_representante_id_fkey',
    table: 'clientes_representantes',
    column: 'representante_id',
    toTable: 'representantes',
    toCol: 'id',
  },
]

async function getRule(sql, constraint) {
  const rows = await sql`
    SELECT rc.delete_rule
    FROM information_schema.referential_constraints rc
    WHERE rc.constraint_name = ${constraint}
      AND rc.constraint_schema = 'public'`
  return rows[0]?.delete_rule ?? null
}

async function fixDb({ name, url }) {
  if (!url) {
    console.log(`[${name}] SEM_URL — pulando`)
    return
  }
  const sql = postgres(url, { prepare: false })
  try {
    for (const fk of FKS) {
      const rule = await getRule(sql, fk.constraint)
      if (rule === null) {
        console.log(`[${name}] constraint ${fk.constraint} NAO EXISTE — pulando`)
        continue
      }
      if (rule === 'CASCADE') {
        console.log(`[${name}] ${fk.constraint} ja esta CASCADE — nada a fazer`)
        continue
      }
      await sql.begin(async (tx) => {
        await tx.unsafe(`ALTER TABLE "${fk.table}" DROP CONSTRAINT "${fk.constraint}"`)
        await tx.unsafe(
          `ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.constraint}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.toTable}"("${fk.toCol}") ON DELETE CASCADE`
        )
      })
      const after = await getRule(sql, fk.constraint)
      console.log(`[${name}] ${fk.constraint}: ${rule} -> ${after}  ✓`)
    }
  } finally {
    await sql.end()
  }
}

;(async () => {
  for (const t of TARGETS) {
    await fixDb(t)
  }
})().catch((e) => {
  console.error('FALHA:', e.message)
  process.exit(1)
})
