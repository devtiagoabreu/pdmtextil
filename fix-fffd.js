const fs = require("fs")
const path = require("path")
const src = "D:/Tiago/dev/pdmtextil/src"
let totalFixed = 0
let fileCount = 0

function fixFile(filePath) {
  const buf = fs.readFileSync(filePath)
  let text = buf.toString("utf-8")
  if (!text.includes("\uFFFD")) return

  let changed = false

  // Common patterns:
  // 1. "�" (U+FFFD + 0x1D) — em dash fallback
  // 2. " � " — em dash separator
  // 3. " �  " — arrow  
  // 4. T�`XTIL — TEXTIL or TÊXTIL
  // 5. "�" — em dash

  const replacements = [
    // "�" + 0x1D → em dash variations
    [/\uFFFD\u001D/g, "\u2014"],           // "—"
    [/" \uFFFD\u001D "/g, ' "—" '],        // " — "
    [/\uFFFD\u001D/g, "\u2014"],           // em dash standalone
    
    // Arrows: U+FFFD + 0x19 → →
    [/\uFFFD\u0019/g, "\u2192"],           // →
    
    // Multiply: U+FFFD + 0x14 → ×  
    [/\uFFFD\u0014/g, "\u00D7"],           // ×

    // Subscript remnants: U+FFFD + 0x1A
    [/\uFFFD\u001A/g, ""],

    // Remaining U+FFFD followed by special chars
    [/\uFFFD`/g, "\u00CA"],                 // Ê (TÊXTIL)
    [/\uFFFD/g, "\u2014"],                  // Anything else → em dash

    // Clean up: "—" when it should be a space-separated separator
    // Fix missing spaces around em dash
    [/}—{/g, "} — {"],
    [/"—"/g, '"—"'],
    [/,"—"/g, ', "—"'],
  ]

  for (const [pattern, replacement] of replacements) {
    const newText = text.replace(pattern, replacement)
    if (newText !== text) {
      changed = true
      text = newText
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, text, "utf-8")
    fileCount++
    const firstDiff = [...text.matchAll(/\u2014/g)]
    const count = firstDiff.length
    totalFixed += count
    const rel = path.relative(src, filePath)
    console.log(`FIXED: ${rel} (${count} em dashes restored)`)
  }
}

function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") walk(p)
    } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      fixFile(p)
    }
  }
}

walk(src)
console.log(`\nDone. ${fileCount} files fixed, approx ${totalFixed} corrupted chars restored.`)

// Final check
let remaining = 0
function walk2(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") walk2(p)
    } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      const c = fs.readFileSync(p, "utf-8")
      if (c.includes("\uFFFD")) {
        remaining++
        const idx = c.indexOf("\uFFFD")
        const ctx = c.substring(Math.max(0, idx - 10), idx + 10).replace(/\n/g, "|").replace(/\r/g, "")
        console.log(`REMAINING: ${path.relative(src, p)}: ${ctx}`)
      }
    }
  }
}
walk2(src)
console.log(`Remaining files with U+FFFD: ${remaining}`)
