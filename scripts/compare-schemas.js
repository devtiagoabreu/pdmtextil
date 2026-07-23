const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function getSchemas(pool) {
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `)
  const result = {}
  for (const { table_name } of tables.rows) {
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 ORDER BY ordinal_position
    `, [table_name])
    result[table_name] = cols.rows
  }
  return result
}

async function main() {
  const databases = [
    { name: 'pdm_textil', url: process.env.DATABASE_URL },
    { name: 'pdm_pro_textil', url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
    { name: 'pdm_ibirapuera', url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
    { name: 'neon', url: process.env.DATABASE_URL_NEON },
  ]

  const allSchemas = {}
  for (const db of databases) {
    if (!db.url) { console.log(db.name + ': URL not set'); continue }
    const pool = new Pool({ connectionString: db.url })
    try {
      allSchemas[db.name] = await getSchemas(pool)
    } catch (e) {
      console.error(db.name + ': ERROR ' + e.message)
    } finally {
      await pool.end()
    }
  }

  // Compare
  const dbNames = Object.keys(allSchemas)
  const reference = allSchemas[dbNames[0]]
  
  // Tables diff
  const allTables = new Set()
  for (const name of dbNames) {
    for (const t of Object.keys(allSchemas[name])) allTables.add(t)
  }

  const diffs = []
  for (const table of [...allTables].sort()) {
    const refCols = reference[table]
    for (const dbName of dbNames.slice(1)) {
      const otherCols = allSchemas[dbName][table]
      if (!refCols && otherCols) {
        diffs.push(`${dbName}: table ${table} MISSING`)
        continue
      }
      if (refCols && !otherCols) {
        diffs.push(`${dbName}: EXTRA table ${table}`)
        continue
      }
      if (!refCols || !otherCols) continue
      
      // Compare columns
      const refMap = {}
      for (const c of refCols) refMap[c.column_name] = c
      const otherMap = {}
      for (const c of otherCols) otherMap[c.column_name] = c

      for (const col of Object.keys(refMap)) {
        if (!otherMap[col]) {
          diffs.push(`${dbName}: table ${table} MISSING column ${col}`)
        } else if (refMap[col].data_type !== otherMap[col].data_type) {
          diffs.push(`${dbName}: table ${table}.${col} type ${otherMap[col].data_type} (expected ${refMap[col].data_type})`)
        }
      }
      for (const col of Object.keys(otherMap)) {
        if (!refMap[col]) {
          diffs.push(`${dbName}: table ${table} EXTRA column ${col}`)
        }
      }
    }
  }

  if (diffs.length === 0) {
    console.log('All databases are IDENTICAL')
  } else {
    console.log('DIFFERENCES FOUND:')
    diffs.forEach(d => console.log('  - ' + d))
  }
  
  // Also output table counts
  for (const name of dbNames) {
    const count = Object.keys(allSchemas[name] || {}).length
    console.log(name + ': ' + count + ' tables')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
