require('dotenv').config({path:'.env.local'})
const {Client} = require('pg')

async function check() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false })
  await c.connect()
  
  const r = await c.query(`
    SELECT execution_id, step, status, input, output, error, created_at
    FROM crm_whatsapp_flow_logs 
    WHERE step = 'auth'
    ORDER BY created_at DESC
    LIMIT 10
  `)
  
  for (const row of r.rows) {
    const t = row.created_at.toISOString().replace('T', ' ').substring(0, 19)
    console.log(`\n[${t}] ${row.execution_id.substring(0,8)} | ${row.status}`)
    if (row.input) console.log(`  INPUT:  ${JSON.stringify(row.input)}`)
    if (row.output) console.log(`  OUTPUT: ${JSON.stringify(row.output)}`)
    if (row.error) console.log(`  ERROR:  ${row.error}`)
  }
  
  await c.end()
}

check().catch(e => { console.error(e.message); process.exit(1) })
