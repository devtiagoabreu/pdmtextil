const { drizzle } = require("drizzle-orm/postgres-js")
const postgres = require("postgres")
require("dotenv").config({ path: ".env.local" })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1 })

async function main() {
  // Find all text columns with mojibake or U+FFFD
  const tables = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('text', 'character varying', 'json', 'jsonb')
    ORDER BY table_name, column_name
  `

  let totalFixed = 0
  let totalRows = 0

  for (const { table_name, column_name } of tables) {
    const table = table_name
    const column = column_name

    // Skip known non-text columns
    if (column.endsWith("_id") || column === "id" || column === "password") continue

    // Query for rows with mojibake patterns or U+FFFD
    const rows = await sql`
      SELECT id, ${sql(column)} as val 
      FROM ${sql(table)}
      WHERE ${sql(column)}::text ~ '[\uFFFD\u0014\u0019\u001A\u001D]'
         OR ${sql(column)}::text ~ 'Ã[§£µ¡©ªëïöüèéêëìíîòóôõùúûñ]';
    `

    for (const row of rows) {
      if (!row.val) continue
      const original = String(row.val)
      const fixed = fixText(original)
      if (fixed !== original) {
        await sql`
          UPDATE ${sql(table)} 
          SET ${sql(column)} = ${fixed}
          WHERE id = ${row.id}
        `
        totalFixed++
        totalRows++
      }
    }

    if (rows.length > 0) {
      console.log(`${table}.${column}: ${rows.length} rows checked, fixed`)
    }
  }

  console.log(`\nTotal: ${totalFixed} cells fixed across ${totalRows} rows`)
  process.exit(0)
}

function fixText(text) {
  // U+FFFD + control chars
  let t = text
  t = t.replace(/\uFFFD\u001D/g, "\u2014")
  t = t.replace(/\uFFFD\u0019/g, "\u2192")
  t = t.replace(/\uFFFD\u0014/g, "\u00D7")
  t = t.replace(/\uFFFD\u001A/g, "")
  t = t.replace(/\uFFFD/g, "")
  // Moji bake patterns
  t = t.replace(/Ã§/g, "ç")
  t = t.replace(/Ã£/g, "ã")
  t = t.replace(/Ãµ/g, "õ")
  t = t.replace(/Ã¡/g, "á")
  t = t.replace(/Ã©/g, "é")
  t = t.replace(/Ãª/g, "ê")
  t = t.replace(/Ã³/g, "ó")
  t = t.replace(/Ã´/g, "ô")
  t = t.replace(/Ãº/g, "ú")
  t = t.replace(/Ã¢/g, "â")
  t = t.replace(/Ã­/g, "í")
  t = t.replace(/Ã¬/g, "ì")
  t = t.replace(/Ã±/g, "ñ")
  t = t.replace(/Ã¼/g, "ü")
  // Windows-1252 roundtrip for remaining
  try {
    const bytes = []
    for (let i = 0; i < t.length; i++) {
      const code = t.charCodeAt(i)
      if (code >= 0xA0 && code <= 0xFF) {
        bytes.push(code)
      } else if (code < 0x80) {
        bytes.push(code)
      } else if (code >= 0x80 && code <= 0x9F) {
        bytes.push(code)
      } else {
        // Try CP1252 mapping
        const map = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F }
        bytes.push(map[code] !== undefined ? map[code] : 0x3F)
      }
    }
    const decoded = Buffer.from(bytes).toString("utf-8")
    if (decoded !== t && !decoded.includes("\uFFFD")) {
      return decoded
    }
  } catch {}
  return t
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
