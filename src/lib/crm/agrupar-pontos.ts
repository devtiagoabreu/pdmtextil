export type PontoMapa = {
  id: number
  latitude: number
  longitude: number
  rotulo: string
}

export type GrupoMapa = {
  latitude: number
  longitude: number
  ids: number[]
  rotulos: string[]
  ordem: number[]
}

export function agruparPontos(pontos: PontoMapa[], precisao: number = 3): GrupoMapa[] {
  const agrupado = new Map<string, GrupoMapa>()
  pontos.forEach((p, i) => {
    const chave = `${p.latitude.toFixed(precisao)},${p.longitude.toFixed(precisao)}`
    const grupo = agrupado.get(chave)
    if (grupo) {
      grupo.ids.push(p.id)
      grupo.rotulos.push(p.rotulo)
      grupo.ordem.push(i + 1)
    } else {
      agrupado.set(chave, {
        latitude: p.latitude,
        longitude: p.longitude,
        ids: [p.id],
        rotulos: [p.rotulo],
        ordem: [i + 1],
      })
    }
  })
  return [...agrupado.values()]
}