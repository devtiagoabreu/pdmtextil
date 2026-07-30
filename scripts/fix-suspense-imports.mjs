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
  "src/app/(dashboard)/comercial/crm/contatos/novo/page.tsx",
  "src/app/(dashboard)/comercial/crm/pessoas/[id]/page.tsx",
  "src/app/(dashboard)/comercial/crm/treinamento/admin/novo/page.tsx",
  "src/app/(dashboard)/comercial/crm/visitas/novo/page.tsx",
  "src/app/(dashboard)/comercial/requisicoes-corte/page.tsx",
  "src/app/(dashboard)/amostras/page.tsx",
  "src/app/(dashboard)/dashboard/relatorios/historico-amostra/page.tsx",
  "src/app/(dashboard)/dashboard/relatorios/historico-solicitacao/page.tsx",
]

for (const f of files) {
  const fp = join(root, f)
  let src = readFileSync(fp, "utf-8")
  if (src.includes("page-skeleton")) {
    console.log(`✓ ${f} (already has import)`)
    continue
  }
  const lines = src.split("\n")
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("import ")) lastImportIdx = i
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, 'import { PageSkeleton } from "@/components/ui/page-skeleton"')
    src = lines.join("\n")
    writeFileSync(fp, src, "utf-8")
    console.log(`✓ ${f} (added import)`)
  } else {
    console.log(`✗ ${f} (no imports found)`)
  }
}
