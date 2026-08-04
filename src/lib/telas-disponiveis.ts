import fs from "fs"
import path from "path"
import { searchRegistry, type SearchItem } from "@/lib/search-registry"

const IGNORAR_HREFS = new Set(["/", "/login"])

const MODULO_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  amostras: "Amostras",
  bi: "BI",
  cadastros: "Cadastros",
  chat: "Comunicação",
  comercial: "Comercial",
  documentos: "Documentos",
  ferramentas: "Ferramentas",
  perfil: "Conta",
  admin: "Administrativo",
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function labelDeHref(href: string): string {
  const parts = href.split("/").filter(Boolean)
  const ultimo = parts[parts.length - 1] || ""
  if (!ultimo) return "Página"
  return ultimo
    .split("-")
    .map((p) => (p.toUpperCase() === p ? p : capitalizar(p)))
    .join(" ")
}

function moduloDeHref(href: string): string {
  const primeiro = href.split("/").filter(Boolean)[0]
  if (!primeiro) return "Geral"
  return MODULO_LABELS[primeiro] || capitalizar(primeiro)
}

function caminhar(dir: string): string[] {
  const paginas: string[] = []
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name.startsWith(".")) continue
    const caminho = path.join(dir, entrada.name)
    if (entrada.isDirectory()) {
      paginas.push(...caminhar(caminho))
    } else if (entrada.isFile() && entrada.name === "page.tsx") {
      paginas.push(caminho)
    }
  }
  return paginas
}

function hrefDeCaminho(caminho: string): string | null {
  const base = path.join(process.cwd(), "src", "app")
  const rel = path.relative(base, caminho)
  let parts = rel.split(path.sep)
  if (parts[parts.length - 1] === "page.tsx") parts = parts.slice(0, -1)
  parts = parts.filter((p) => !p.startsWith("("))
  if (parts.length === 0) return null
  if (parts.some((p) => p.startsWith("["))) return null
  if (parts[0] === "api") return null
  const href = "/" + parts.join("/")
  if (IGNORAR_HREFS.has(href)) return null
  return href
}

let cache: SearchItem[] | null = null

export function todasTelas(): SearchItem[] {
  if (process.env.NODE_ENV === "production" && cache) return cache

  const porHref = new Map<string, SearchItem>()
  for (const item of searchRegistry) {
    const href = item.href.split("?")[0]
    if (!porHref.has(href)) porHref.set(href, item)
  }

  const resultados: SearchItem[] = [...searchRegistry]
  const diretorio = path.join(process.cwd(), "src", "app")
  if (fs.existsSync(diretorio)) {
    for (const arquivo of caminhar(diretorio)) {
      const href = hrefDeCaminho(arquivo)
      if (!href) continue
      if (porHref.has(href)) continue
      const novo: SearchItem = {
        id: "pagina-" + href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""),
        label: labelDeHref(href),
        keywords: [],
        href,
        description: "",
        module: moduloDeHref(href),
      }
      porHref.set(href, novo)
      resultados.push(novo)
    }
  }

  if (process.env.NODE_ENV === "production") cache = resultados
  return resultados
}
