import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configurarEspacamentoGeocode, geocodificarEndereco, limparCacheGeocode } from "./geocode"

const ORIGINAL_FETCH = globalThis.fetch

function mockFetch(json: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    json: async () => json,
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

describe("geocodificarEndereco", () => {
  beforeEach(() => {
    configurarEspacamentoGeocode(0)
    limparCacheGeocode()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    globalThis.fetch = ORIGINAL_FETCH
    configurarEspacamentoGeocode(1050)
  })

  it("retorna null para endereço muito curto sem chamar a API", async () => {
    const fetchMock = mockFetch([])
    expect(await geocodificarEndereco("Rua A")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("retorna as coordenadas em caso de sucesso", async () => {
    const fetchMock = mockFetch([{ lat: "-23.5505", lon: "-46.6333" }])
    const coords = await geocodificarEndereco("Av. X, 100 - Centro, Goiânia, GO")
    expect(coords).toEqual({ latitude: -23.5505, longitude: -46.6333 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.origin).toBe("https://nominatim.openstreetmap.org")
    expect(url.searchParams.get("countrycodes")).toBe("br")
  })

  it("retorna null quando a API não encontra resultados", async () => {
    const fetchMock = mockFetch([])
    expect(await geocodificarEndereco("Endereco inexistente 99999, Lugar Nenhum, MG")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retorna null quando a resposta não é ok", async () => {
    const fetchMock = mockFetch({ error: "erro" }, false)
    expect(await geocodificarEndereco("Av. X, 100 - Centro, Goiânia, GO")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("usa o cache: mesma consulta não chama a API de novo", async () => {
    const fetchMock = mockFetch([{ lat: "-23.5505", lon: "-46.6333" }])
    const endereco = "Av. X, 100 - Centro, Goiânia, GO"
    await geocodificarEndereco(endereco)
    const segunda = await geocodificarEndereco(`  ${endereco}  `)
    expect(segunda).toEqual({ latitude: -23.5505, longitude: -46.6333 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("deduplica consultas em andamento para o mesmo endereço", async () => {
    const fetchMock = mockFetch([{ lat: "-23.5505", lon: "-46.6333" }])
    const [a, b] = await Promise.all([
      geocodificarEndereco("Rua Y, 50 - Centro, Goiânia, GO"),
      geocodificarEndereco("Rua Y, 50 - Centro, Goiânia, GO"),
    ])
    expect(a).toEqual(b)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})