export function ehHrefRotinaValida(href: string): boolean {
  if (!href.startsWith("/")) return false
  if (href.includes("[") || href.includes("]")) return false
  if (href.startsWith("/api")) return false
  return true
}

export function validarUrlRotina(url: string | undefined, ehAdministrador: boolean): string | null {
  if (!url || !url.trim()) return "Título e URL são obrigatórios"

  const u = url.trim()
  if (!u.startsWith("/")) return "URL deve começar com /"
  if (u.includes("[") || u.includes("]")) return "Rotinas de detalhe ([id]) não podem ser adicionadas ao menu"
  if (u.startsWith("/api")) return "URLs de API não podem ser adicionadas ao menu"
  if (u.startsWith("/admin") && !ehAdministrador) return "Páginas administrativas só podem ser adicionadas por administradores"

  return null
}