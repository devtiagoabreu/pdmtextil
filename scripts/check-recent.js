require('dotenv').config({path:'.env.local'})
const {Client} = require('pg')

async function check() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: false })
  await c.connect()
  
  const r = await c.query(`
    SELECT execution_id, step, status, input, output, error, created_at
    FROM crm_whatsapp_flow_logs 
    WHERE execution_id IN ('a9e2a2fe', 'b62182f6', 'cdea49f7')
       OR execution_id LIKE 'a9e2a2fe%' OR execution_id LIKE 'b62182f6%' OR execution_id LIKE 'cdea49f7%'
    ORDER BY created_at DESC
  `)
  
  // Also try partial match
  const r2 = await c.query(`
    SELECT execution_id, step, status, input, output, error, created_at
    FROM crm_whatsapp_flow_logs 
    ORDER BY created_at DESC LIMIT 5
  `)
  
  const rows = [...r.rows, ...r2.rows]
  const seen = new Set()
  for (const row of rows) {
    if (seen.has(row.execution_id + row.step)) continue
    seen.add(row.execution_id + row.step)
    console.log(`\n=== ${row.execution_id} | ${row.step} | ${row.status} | ${row.created_at.toISOString()} ===`)
    if (row.input) console.log(`INPUT: ${JSON.stringify(row.input)}`)
    if (row.output) console.log(`OUTPUT: ${JSON.stringify(row.output)}`)
    if (row.error) console.log(`ERROR: ${row.error}`)
  }
  
  await c.end()
}

check().catch(e => { console.error(e.message); process.exit(1) })
