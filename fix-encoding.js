const fs = require("fs")
const path = require("path")

function fixMojibake(text) {
  // Convert the mojibaked string back to the original
  // Step 1: take the UTF-8 decoded text (which has chars like Ã§)
  // Step 2: encode each char as Latin-1 byte (Ã=0xC3, §=0xA7)
  // Step 3: decode those bytes as UTF-8 (0xC3 0xA7 = ç)
  return Buffer.from(text, "latin1").toString("utf-8")
}

function isProbablyMojibake(text) {
  // Check if text contains characters typical of mojibake
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    // Ã = U+00C3, À = U+00C0, Á = U+00C1, Â = U+00C2, etc.
    // These are common in mojibake of Portuguese text
    if ((c >= 0xC0 && c <= 0xC6) || // ÀÁÂÃÄÅÆ
        (c >= 0xC8 && c <= 0xCB) || // ÈÉÊË
        (c >= 0xCC && c <= 0xCF) || // ÌÍÎÏ
        (c >= 0xD2 && c <= 0xD6) || // ÒÓÔÕÖ
        (c >= 0xD9 && c <= 0xDC) || // ÙÚÛÜ
        (c >= 0xE0 && c <= 0xE6) || // àáâãäåæ
        (c >= 0xE8 && c <= 0xEB) || // èéêë
        (c >= 0xEC && c <= 0xEF) || // ìíîï
        (c >= 0xF2 && c <= 0xF6) || // òóôõö
        (c >= 0xF9 && c <= 0xFC) || // ùúûü
        c === 0xA7 || c === 0xA9 || c === 0xAA || // § © ª
        c === 0xA3 || c === 0xB5 || c === 0xAC || // £ µ ¬
        c === 0xA1 || c === 0xA2 || c === 0xA4) { // ¡ ¢ ¤
      return true
    }
  }
  return false
}

const src = path.resolve("src")
let corrupted = 0
let fixed = 0

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") walk(p)
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      const buf = fs.readFileSync(p)
      const text = buf.toString("utf-8")
      // Check for common mojibake bytes: C3 83 C2 (Ã followed by Â style)
      if (buf.includes(Buffer.from("Ã§", "utf-8")) || 
          buf.includes(Buffer.from("Ã£", "utf-8")) ||
          buf.includes(Buffer.from("Ãµ", "utf-8"))) {
        const fixedText = fixMojibake(text)
        // Verify it actually changed
        if (fixedText !== text && isProbablyMojibake(text)) {
          fs.writeFileSync(p, fixedText, "utf-8")
          corrupted++
          const rel = path.relative(src, p)
          const origEmbed = text.substring(text.indexOf("Ã"), Math.min(text.indexOf("Ã") + 20, text.length))
          const fixEmbed = fixedText.substring(fixedText.indexOf("ç") >= 0 ? fixedText.indexOf("ç") : 0, 
            Math.min((fixedText.indexOf("ç") >= 0 ? fixedText.indexOf("ç") : 0) + 20, fixedText.length))
          console.log("FIXED: " + rel + " | " + origEmbed.replace(/\n/g, "\\n") + " -> " + fixEmbed.replace(/\n/g, "\\n"))
          fixed++
        }
      }
    }
  }
}

walk(src)
console.log("\nTotal corrupted files found and fixed: " + corrupted)
console.log("Total files processed: " + fixed)
