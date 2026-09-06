import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configurarEspacamentoGeocode, geocodificarCamposEndereco, geocodificarEndereco, limparCacheGeocode } from "./geocode"

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
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("retorna null quando a resposta não é ok", async () => {
    const fetchMock = mockFetch({ error: "erro" }, false)
    expect(await geocodificarEndereco("Av. X, 100 - Centro, Goiânia, GO")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("usa cidade+UF como fallback quando o endereço completo não resolve", async () => {
    const fn = vi.fn()
    fn.mockImplementation(async (input: string | URL) => {
      const q = new URL(String(input)).searchParams.get("q")
      if (q === "Rua Desconhecida, 999, Cidade Nova, GO") return { ok: true, json: async () => [] }
      if (q === "Cidade Nova, GO") return { ok: true, json: async () => [{ lat: "-16.68", lon: "-49.25" }] }
      return { ok: true, json: async () => [] }
    })
    vi.stubGlobal("fetch", fn)
    const coords = await geocodificarEndereco("Rua Desconhecida, 999, Cidade Nova, GO")
    expect(coords).toEqual({ latitude: -16.68, longitude: -49.25 })
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(3)
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

describe("geocodificarCamposEndereco", () => {
  beforeEach(() => {
    configurarEspacamentoGeocode(0)
    limparCacheGeocode()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    globalThis.fetch = ORIGINAL_FETCH
    configurarEspacamentoGeocode(1050)
  })

  it("consulta o Nominatim com parâmetros estruturados (street/city/state) em vez de q livre", async () => {
    const fetchMock = mockFetch([{ lat: "-23.5505", lon: "-46.6333" }])
    const coords = await geocodificarCamposEndereco({
      endereco: "Av. X",
      numero: "100",
      complemento: null,
      bairro: "Centro",
      cidade: "Goiânia",
      uf: "GO",
    })
    expect(coords).toEqual({ latitude: -23.5505, longitude: -46.6333 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get("street")).toBe("Av. X, 100")
    expect(url.searchParams.get("city")).toBe("Goiânia")
    expect(url.searchParams.get("state")).toBe("GO")
    expect(url.searchParams.get("country")).toBe("br")
    expect(url.searchParams.get("q")).toBeNull()
  })

  it("usa a busca estruturada de cidade+UF quando rua e número não resolvem", async () => {
    const fn = vi.fn()
    fn.mockImplementation(async (input: string | URL) => {
      const url = new URL(String(input))
      if (url.searchParams.has("street")) return { ok: true, json: async () => [] }
      if (!url.searchParams.has("q")) return { ok: true, json: async () => [{ lat: "-16.68", lon: "-49.25" }] }
      return { ok: true, json: async () => [] }
    })
    vi.stubGlobal("fetch", fn)
    const coords = await geocodificarCamposEndereco({
      endereco: "Rua Torta, 999",
      numero: null,
      complemento: null,
      bairro: null,
      cidade: "Cidade Nova",
      uf: "GO",
    })
    expect(coords).toEqual({ latitude: -16.68, longitude: -49.25 })
    const chamadas = fn.mock.calls.map((c) => new URL(String(c[0])).searchParams)
    expect(chamadas.filter((p) => p.has("street"))).toHaveLength(1)
    expect(chamadas.some((p) => !p.has("street") && !p.has("q"))).toBe(true)
  })
})