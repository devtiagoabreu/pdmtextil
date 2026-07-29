const postgres = require("postgres")
require("dotenv").config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL, { max: 1 })

async function main() {
  const tables = await sql`
    SELECT table_name::text, column_name::text 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('text', 'character varying')
    ORDER BY table_name, column_name
  `

  let found = 0
  for (const { table_name, column_name } of tables) {
    const table = table_name
    const column = column_name
    try {
      const rows = await sql`
        SELECT id, ${sql(column)} as val 
        FROM ${sql(table)}
        WHERE ${sql(column)}::text ~ '\\uFFFD|\\u0014|\\u0019|\\u001A|\\u001D'
      `
      for (const r of rows) {
        if (!r.val) continue
        const s = String(r.val)
        if (s.includes("\uFFFD") || s.includes("\u0014") || s.includes("\u0019") || s.includes("\u001A") || s.includes("\u001D")) {
          const idx = Math.max(0, s.indexOf("\uFFFD") >= 0 ? s.indexOf("\uFFFD") : s.search(/[\u0014\u0019\u001A\u001D]/))
          const ctx = s.substring(Math.max(0, idx - 15), idx + 25).replace(/\n/g, "|").replace(/\r/g, "")
          console.log(`${table}.${column} id=${r.id}: ${ctx}`)
          found++
        }
      }
    } catch (e) {
      // skip json columns that can't be cast to text
    }
  }
  console.log(`\nFound ${found} rows with corrupted data`)
  process.exit(0)
}
main().catch(console.error)
