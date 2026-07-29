const fs = require("fs")
const path = require("path")
const src = "D:/Tiago/dev/pdmtextil/src"
let found = []

// Check ALL file types this time
function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") walk(p)
    } else {
      const buf = fs.readFileSync(p)
      if (buf.includes(0xef) && buf.includes(0xbf) && buf.includes(0xbd)) {
        // Check for U+FFFD in UTF-8 decoded text
        const text = buf.toString("utf-8")
        if (text.includes("\uFFFD")) {
          const idx = text.indexOf("\uFFFD")
          const ctx = text.substring(Math.max(0, idx - 15), idx + 20).replace(/\n/g, "|").replace(/\r/g, "")
          found.push(p.substring(src.length) + ": " + ctx)
        }
      }
    }
  }
}

walk(src)
console.log("Files with U+FFFD: " + found.length)
found.forEach((f) => console.log(f))
