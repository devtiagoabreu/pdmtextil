const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const DBS = [
  { nome: 'pdm_textil', url: process.env.DATABASE_URL },
  { nome: 'neon', url: process.env.DATABASE_URL_NEON },
]

async function main() {
  for (const db of DBS) {
    console.log(`\n=== ${db.nome} ===`)
    try {
      const pool = new Pool({ connectionString: db.url, connectionTimeoutMillis: 15000 })
      const tabs = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'reuni%' ORDER BY table_name`)
      console.log('tabelas reunioes:', tabs.rows.map(r => r.table_name).join(', ') || '(nenhuma)')
      if (tabs.rows.length > 0) {
        const c = await pool.query(`SELECT count(*)::int c FROM reunioes`)
        console.log('quantidade de reunioes:', c.rows[0].c)
      }
      await pool.end()
    } catch (e) {
      console.log('ERRO:', e.message)
    }
  }
}
main().catch(e => { console.error(e); process.exit(1) })