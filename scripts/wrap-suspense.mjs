import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const files = [
  "src/app/(dashboard)/comercial/crm/leads/page.tsx",
  "src/app/(dashboard)/comercial/crm/pessoas/page.tsx",
  "src/app/(dashboard)/comercial/crm/visitas/page.tsx",
  "src/app/(dashboard)/comercial/crm/propostas/page.tsx",
  "src/app/(dashboard)/comercial/crm/campanhas/page.tsx",
  "src/app/(dashboard)/comercial/crm/tarefas/page.tsx",
  "src/app/(dashboard)/comercial/crm/contatos/novo/page.tsx",
  "src/app/(dashboard)/comercial/crm/pessoas/[id]/page.tsx",
  "src/app/(dashboard)/comercial/crm/treinamento/admin/novo/page.tsx",
  "src/app/(dashboard)/comercial/crm/visitas/novo/page.tsx",
  "src/app/(dashboard)/comercial/requisicoes-corte/page.tsx",
  "src/app/(dashboard)/amostras/page.tsx",
  "src/app/(dashboard)/dashboard/relatorios/historico-amostra/page.tsx",
  "src/app/(dashboard)/dashboard/relatorios/historico-solicitacao/page.tsx",
]

const REACT_IMPORT_RE = /^(import\s*\{)([^}]+)(\}\s*from\s+["']react["'])/m
const FUNCTION_RE = /^export default function (\w+Page)\(/m
const SUSPENSE_IMPORT = `import { PageSkeleton } from "@/components/ui/page-skeleton"`

for (const f of files) {
  const fp = join(root, f)
  let src = readFileSync(fp, "utf-8")
  let changed = false

  // 1. Add Suspense to react import
  if (REACT_IMPORT_RE.test(src)) {
    src = src.replace(REACT_IMPORT_RE, (_, open, body, close) => {
      if (body.includes("Suspense")) return _
      return `${open}Suspense, ${body.trim()}${close}`
    })
  } else {
    // No react import - add it
    const firstImport = src.indexOf("import ")
    const endOfLine = src.indexOf("\n", firstImport)
    src = src.slice(0, endOfLine + 1) + `import { Suspense } from "react"\n` + src.slice(endOfLine + 1)
  }

  // 2. Add PageSkeleton import after the last import line
  const lines = src.split("\n")
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImportIdx = i
  }
  if (lastImportIdx >= 0 && !src.includes("page-skeleton")) {
    lines.splice(lastImportIdx + 1, 0, SUSPENSE_IMPORT)
    src = lines.join("\n")
  }

  // 3. Rename default export function
  const funcMatch = src.match(FUNCTION_RE)
  if (funcMatch) {
    const name = funcMatch[1]
    src = src.replace(FUNCTION_RE, `function ${name}Content(`)
    // Check if the function has `(` already (it might be `(` or `(` after the name)
    // The regex already handles this - it matches `export default function XxxPage(`
    // We replace with `function XxxPageContent(`

    // 4. Add wrapper at end
    const wrapper = `\n\nexport default function ${name}() {\n  return (\n    <Suspense fallback={<PageSkeleton />}>\n      <${name}Content />\n    </Suspense>\n  )\n}`
    src = src.trimEnd() + wrapper + "\n"
    changed = true
  }

  if (changed) {
    writeFileSync(fp, src, "utf-8")
    console.log(`✓ ${f}`)
  } else {
    console.log(`✗ ${f} (no changes)`)
  }
}
