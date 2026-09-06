export type ResultadoBuscaLocal = {
  latitude: number
  longitude: number
  rotulo: string
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

export async function buscarLocal(termo: string, signal?: AbortSignal): Promise<ResultadoBuscaLocal[]> {
  const texto = termo.trim()
  if (texto.length < 3) return []
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q", texto)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "6")
  url.searchParams.set("countrycodes", "br")
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "pdm-textil/1.0 (mapa do cronograma)", Accept: "application/json" },
      signal,
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data
      .map((item: any) => ({
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        rotulo: String(item.display_name || ""),
      }))
      .filter((r: ResultadoBuscaLocal) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && r.rotulo)
  } catch {
    return []
  }
}

export function formatarCoordenadas(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}