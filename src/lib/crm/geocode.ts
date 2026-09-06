export interface Coordenadas {
  latitude: number
  longitude: number
}

let espacamentoMs = 1050

export function configurarEspacamentoGeocode(ms: number) {
  espacamentoMs = ms
}

export function limparCacheGeocode() {
  cache.clear()
  emAndamento.clear()
  fila = Promise.resolve()
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "pdm-textil/1.0 (gestao comercial interna)"

const cache = new Map<string, Coordenadas>()
const emAndamento = new Map<string, Promise<Coordenadas | null>>()

let fila: Promise<unknown> = Promise.resolve()

function enfileirar<T>(fn: () => Promise<T>): Promise<T> {
  const executar = fila.then(fn)
  fila = executar
    .catch(() => null)
    .then(() => new Promise((resolve) => setTimeout(resolve, espacamentoMs)))
  return executar
}

function normalizar(texto: string) {
  return texto.trim().replace(/\s+/g, " ").toLowerCase()
}

async function consultar(chave: string, enderecoTexto: string): Promise<Coordenadas | null> {
  try {
    const url = new URL(NOMINATIM_URL)
    url.searchParams.set("q", enderecoTexto)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    url.searchParams.set("countrycodes", "br")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      })
      if (!res.ok) return null
      const data = await res.json()
      const item = Array.isArray(data) ? data[0] : null
      if (!item) return null
      const latitude = Number(item.lat)
      const longitude = Number(item.lon)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
      const coordenadas = { latitude, longitude }
      cache.set(chave, coordenadas)
      return coordenadas
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return null
  }
}

export async function geocodificarEndereco(enderecoTexto: string): Promise<Coordenadas | null> {
  const chave = normalizar(enderecoTexto)
  if (chave.length < 10) return null
  if (cache.has(chave)) return cache.get(chave)!
  if (emAndamento.has(chave)) return emAndamento.get(chave)!

  const promessa = enfileirar(() => consultar(chave, enderecoTexto))
  emAndamento.set(chave, promessa)
  try {
    return await promessa
  } finally {
    emAndamento.delete(chave)
  }
}