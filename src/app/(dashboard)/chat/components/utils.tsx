export function renderMensagem(texto: string, allUsers: { id: number; name: string }[]) {
  const parts = texto.split(/(@\w[\wÀ-ÿ\s]*\w|\B@\w+)/g)
  return parts.map((part: any, i: any) => {
    if (part.startsWith("@")) {
      const nome = part.slice(1).trim()
      const isKnown = allUsers.some((u: any) => u.name.toLowerCase() === nome.toLowerCase())
      if (isKnown) {
        return (
          <span key={`${i}-${part}`} className="font-semibold text-blue-500 dark:text-blue-400">
            {part}
          </span>
        )
      }
    }
    return part
  })
}

export function isWithin5Min(data: string) {
  return (Date.now() - new Date(data).getTime()) < 5 * 60 * 1000
}
