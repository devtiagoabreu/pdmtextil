import { describe, expect, it, vi } from "vitest"
import { db } from "@/lib/db"
import { obterRepresentantes, notificarRepresentantes } from "./representantes"
import { evolutionConfigurado, enviarMensagem } from "@/lib/evolution-api"
import { createQueryBuilder } from "@/test/route-db-mock"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))
vi.mock("@/lib/evolution-api", () => ({
  evolutionConfigurado: vi.fn(() => true),
  enviarMensagem: vi.fn(),
}))

describe("obterRepresentantes", () => {
  it("retorna celulares de usuarios ativos com cel_whatsapp (qualquer role)", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([
        { celWhatsapp: "5519999999999" },
        { celWhatsapp: "5519999999998" },
        { celWhatsapp: null },
        { celWhatsapp: "" },
      ])
    )

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999999", "5519999999998"])
    expect(vi.mocked(db.select)).toHaveBeenCalled()
  })

  it("usa fallback env (PJ) quando nenhum usuario ativo tem cel_whatsapp", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([]))

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999999"])
  })

  it("usa fallback env (PF) quando nenhum usuario ativo tem cel_whatsapp", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([]))

    const numeros = await obterRepresentantes("PF")
    expect(numeros).toEqual(["5519999999998"])
  })

  it("limpa digitos nao numericos do cel_whatsapp", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([{ celWhatsapp: "(19) 99999-9999" }])
    )

    const numeros = await obterRepresentantes("PF")
    expect(numeros[0]).toBe("19999999999")
  })

  it("desconsidera cel_whatsapp muito curtos ou longos", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([{ celWhatsapp: "123" }, { celWhatsapp: "123456789012345678901234"}])
    )

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999999"])
  })
})

describe("notificarRepresentantes", () => {
  it("nao envia quando evolution nao configurado", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(false)

    await notificarRepresentantes("msg", "PF")
    expect(enviarMensagem).not.toHaveBeenCalled()
  })

  it("envia mensagem para cada representante", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(true)
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([{ celWhatsapp: "5519999999999" }, { celWhatsapp: "5519999999998" }])
    )

    await notificarRepresentantes("mensagem", "PF")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999999@s.whatsapp.net", "mensagem")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999998@s.whatsapp.net", "mensagem")
  })

  it("usa fallback single quando nao ha representantes configurados (PF)", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(true)
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([]))

    await notificarRepresentantes("mensagem", "PF")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999998@s.whatsapp.net", "mensagem")
  })
})