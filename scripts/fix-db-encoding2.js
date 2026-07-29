const postgres = require("postgres")
require("dotenv").config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1) }

function fixText(text) {
  if (!text) return text
  let t = String(text)
  const before = t
  // U+FFFD + control chars
  t = t.replace(/\uFFFD\u001D/g, "\u2014")
  t = t.replace(/\uFFFD\u0019/g, "\u2192")
  t = t.replace(/\uFFFD\u0014/g, "\u00D7")
  t = t.replace(/\uFFFD\u001A/g, "")
  t = t.replace(/\uFFFD/g, "")
  // Common mojibake
  t = t.replace(/Ã§/g, "ç").replace(/Ã£/g, "ã").replace(/Ãµ/g, "õ")
  t = t.replace(/Ã¡/g, "á").replace(/Ã©/g, "é").replace(/Ãª/g, "ê")
  t = t.replace(/Ã³/g, "ó").replace(/Ã´/g, "ô").replace(/Ãº/g, "ú")
  t = t.replace(/Ã¢/g, "â").replace(/Ã­/g, "í").replace(/Ã¬/g, "ì")
  t = t.replace(/Ã±/g, "ñ").replace(/Ã¼/g, "ü")
  // Win1252 roundtrip for remaining high bytes
  const bytes = []
  const map = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F }
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i)
    if (c < 0x80 || (c >= 0xA0 && c <= 0xFF)) { bytes.push(c) }
    else if (map[c] !== undefined) { bytes.push(map[c]) }
    else { bytes.push(c & 0xFF) }
  }
  try {
    const decoded = Buffer.from(bytes).toString("utf-8")
    if (decoded !== before && !decoded.includes("\uFFFD")) return decoded
  } catch {}
  return before !== t ? t : text
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 })
  let totalFixed = 0
  let totalRowsChecked = 0

  const tables = await sql`
    SELECT table_name::text, column_name::text 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('text', 'character varying')
    ORDER BY table_name, column_name
  `

  for (const { table_name, column_name } of tables) {
    const table = table_name
    const column = column_name

    const rows = await sql`
      SELECT id, ${sql(column)} as val 
      FROM ${sql(table)}
      WHERE ${sql(column)}::text ~ 'Ã|�|\u0014|\u0019|\u001A|\u001D'
    `

    if (rows.length === 0) continue

    let fixedInTable = 0
    for (const row of rows) {
      totalRowsChecked++
      const fixed = fixText(row.val)
      if (fixed !== row.val) {
        await sql`
          UPDATE ${sql(table)} 
          SET ${sql(column)} = ${fixed}
          WHERE id = ${row.id}
        `
        fixedInTable++
        totalFixed++
      }
    }

    if (fixedInTable > 0) {
      console.log(`${table}.${column}: ${fixedInTable} rows fixed (${rows.length} checked)`)
    }
  }

  console.log(`\nTotal: ${totalFixed} cells fixed across ${totalTables.length} tables`)
  process.exit(0)
}

let totalTables = []

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
