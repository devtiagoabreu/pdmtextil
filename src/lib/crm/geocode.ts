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

export function candidatosEndereco(texto: string): string[] {
  const segs = texto
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (segs.length === 0) return []
  const full = segs.join(", ")
  const semNumero = segs.filter((s) => !/^\d+$/.test(s) && !/^s\.?\/?\s*n\.?$/i.test(s)).join(", ")
  const cidade = segs.length >= 2 ? segs.slice(-2).join(", ") : ""
  const vistos = new Set<string>()
  const unicos: string[] = []
  for (const c of [full, semNumero, cidade]) {
    if (c.length >= 10) {
      const cn = normalizar(c)
      if (!vistos.has(cn)) {
        vistos.add(cn)
        unicos.push(c)
      }
    }
  }
  return unicos
}

export async function geocodificarEndereco(enderecoTexto: string): Promise<Coordenadas | null> {
  const chave = normalizar(enderecoTexto)
  if (chave.length < 10) return null
  if (cache.has(chave)) return cache.get(chave)!
  if (emAndamento.has(chave)) return emAndamento.get(chave)!

  const promessa = enfileirar(() => consultarProgressivo(chave, enderecoTexto))
  emAndamento.set(chave, promessa)
  try {
    return await promessa
  } finally {
    emAndamento.delete(chave)
  }
}

async function consultarProgressivo(chave: string, enderecoTexto: string): Promise<Coordenadas | null> {
  for (const candidato of candidatosEndereco(enderecoTexto)) {
    const candidatoNormalizado = normalizar(candidato)
    const conhecido = cache.get(candidatoNormalizado)
    if (conhecido) {
      cache.set(chave, conhecido)
      return conhecido
    }
    const coords = await consultar(candidatoNormalizado, candidato)
    if (coords) {
      cache.set(chave, coords)
      return coords
    }
  }
  return null
}