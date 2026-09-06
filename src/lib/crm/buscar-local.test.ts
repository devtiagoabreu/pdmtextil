import { afterEach, describe, expect, it, vi } from "vitest"
import { buscarLocal, formatarCoordenadas } from "./buscar-local"

const ORIGINAL_FETCH = globalThis.fetch

afterEach(() => {
  vi.unstubAllGlobals()
  globalThis.fetch = ORIGINAL_FETCH
})

describe("buscarLocal", () => {
  it("retorna lista vazia para termos curtos sem chamar a API", async () => {
    const fn = vi.fn()
    vi.stubGlobal("fetch", fn)
    expect(await buscarLocal("a")).toEqual([])
    expect(fn).not.toHaveBeenCalled()
  })

  it("consulta o Nominatim com q livre e trata os resultados", async () => {
    const fn = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "-16.681", lon: "-49.253", display_name: "Goiânia, GO, Brasil" }],
      })
    vi.stubGlobal("fetch", fn)
    const resultados = await buscarLocal("Goiânia")
    expect(resultados).toEqual([{ latitude: -16.681, longitude: -49.253, rotulo: "Goiânia, GO, Brasil" }])
    const url = new URL(String(fn.mock.calls[0][0]))
    expect(url.origin).toBe("https://nominatim.openstreetmap.org")
    expect(url.searchParams.get("q")).toBe("Goiânia")
    expect(url.searchParams.get("countrycodes")).toBe("br")
    expect(url.searchParams.get("limit")).toBe("6")
  })

  it("retorna lista vazia quando a API falha ou não acha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    expect(await buscarLocal("Bairro nenhum")).toEqual([])
  })

  it("ignora itens sem coordenadas válidas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { lat: "x", lon: "y", display_name: "Invalido" },
          { lat: "-22.21", lon: "-49.95", display_name: "Marília, SP" },
        ],
      })
    )
    const resultados = await buscarLocal("Marília")
    expect(resultados).toEqual([{ latitude: -22.21, longitude: -49.95, rotulo: "Marília, SP" }])
  })
})

describe("formatarCoordenadas", () => {
  it("formata com 5 casas decimais", () => {
    expect(formatarCoordenadas(-16.6812345, -49.2539876)).toBe("-16.68123, -49.25399")
  })
})