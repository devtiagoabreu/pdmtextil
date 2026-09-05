import { describe, expect, it, vi } from "vitest"
import { db } from "@/lib/db"
import { obterDestinatarios, obterRepresentantes, notificarDestinatariosEmail, notificarRepresentantes } from "./representantes"
import { evolutionConfigurado, enviarMensagem } from "@/lib/evolution-api"
import { createQueryBuilder } from "@/test/route-db-mock"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))
vi.mock("@/lib/evolution-api", () => ({
  evolutionConfigurado: vi.fn(() => true),
  enviarMensagem: vi.fn(),
}))
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }))

import { sendEmail } from "@/lib/email"

const configurados = [
  { usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: "5519999999999" },
  { usuarioId: 2, nome: "Beto", email: "beto@empresa.com", celWhatsapp: "5519999999998" },
]

const legados = [
  { celWhatsapp: "5519999999997" },
  { celWhatsapp: "5519999999996" },
]

function mockSequencia(primeiro: unknown, resto?: unknown) {
  vi.mocked(db.select).mockReset()
  vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(primeiro))
  if (resto !== undefined) {
    for (const r of Array.isArray(resto) && resto.length ? resto : [resto]) {
      vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
    }
  }
}

describe("obterDestinatarios", () => {
  it("retorna destinatários configurados com dados do usuário", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder(configurados))

    const lista = await obterDestinatarios("PJ")
    expect(lista).toEqual(configurados)
    expect(lista[0].email).toBe("ana@empresa.com")
  })

  it("retorna vazio e não lança quando a tabela ainda não existe no banco", async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('relation "crm_whatsapp_destinatarios" does not exist')
    })

    const lista = await obterDestinatarios("PF")
    expect(lista).toEqual([])
  })
})

describe("obterRepresentantes", () => {
  it("prioriza destinatários configurados (não busca usuários legados)", async () => {
    mockSequencia(configurados)

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999999", "5519999999998"])
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(1)
  })

  it("sem config cai no fallback legado (usuarios ativos com cel_whatsapp)", async () => {
    mockSequencia([], [legados])

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999997", "5519999999996"])
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(2)
  })

  it("usa fallback env (PJ) quando destinatários e usuarios ativos não têm cel", async () => {
    mockSequencia([], [[]])

    const numeros = await obterRepresentantes("PJ")
    expect(numeros).toEqual(["5519999999999"])
  })

  it("usa fallback env (PF) quando destinatários e usuarios ativos não têm cel", async () => {
    mockSequencia([], [[]])

    const numeros = await obterRepresentantes("PF")
    expect(numeros).toEqual(["5519999999998"])
  })

  it("ignora destinatário configurado sem celular válido e cai para usuários", async () => {
    mockSequencia([{ usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: null }], [legados])

    const numeros = await obterRepresentantes("PF")
    expect(numeros).toEqual(["5519999999997", "5519999999996"])
  })

  it("limpa digitos nao numericos do cel_whatsapp configurado", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([{ usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: "(19) 99999-9999" }])
    )

    const numeros = await obterRepresentantes("PF")
    expect(numeros[0]).toBe("19999999999")
  })

  it("desconsidera cel_whatsapp muito curtos ou longos", async () => {
    vi.mocked(db.select).mockImplementation(() =>
      createQueryBuilder([
        { usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: "123" },
        { usuarioId: 2, nome: "Beto", email: "beto@empresa.com", celWhatsapp: "123456789012345678901234" },
      ])
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

  it("envia mensagem para cada representante configurado", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(true)
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder(configurados))

    await notificarRepresentantes("mensagem", "PF")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999999@s.whatsapp.net", "mensagem")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999998@s.whatsapp.net", "mensagem")
  })

  it("usa fallback single quando nao ha representantes configurados (PF)", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(true)
    mockSequencia([], [[]])

    await notificarRepresentantes("mensagem", "PF")
    expect(enviarMensagem).toHaveBeenCalledWith("5519999999998@s.whatsapp.net", "mensagem")
  })
})

describe("notificarDestinatariosEmail", () => {
  it("não envia email quando não há destinatários com email válido", async () => {
    await notificarDestinatariosEmail({
      tipoPessoa: "PJ",
      assunto: "Lead",
      html: "<p>Lead</p>",
      destinatarios: [{ usuarioId: 1, nome: "Ana", email: null, celWhatsapp: "5519999999999" }],
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("envia email para os emails dos destinatários configurados", async () => {
    await notificarDestinatariosEmail({
      tipoPessoa: "PF",
      assunto: "Novo lead PF",
      html: "<p>Lead</p>",
      destinatarios: [
        { usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: "5519999999999" },
        { usuarioId: 2, nome: "Beto", email: "sem-email", celWhatsapp: null },
        { usuarioId: 3, nome: "Carla", email: "carla@empresa.com", celWhatsapp: null },
      ],
    })
    expect(sendEmail).toHaveBeenCalledWith({
      to: ["ana@empresa.com", "carla@empresa.com"],
      subject: "Novo lead PF",
      html: "<p>Lead</p>",
    })
  })

  it("busca destinatários no banco quando não informados e envia email", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder(configurados))

    await notificarDestinatariosEmail({
      tipoPessoa: "PJ",
      assunto: "Novo lead PJ",
      html: "<p>Lead JP</p>",
    })
    expect(sendEmail).toHaveBeenCalledWith({
      to: ["ana@empresa.com", "beto@empresa.com"],
      subject: "Novo lead PJ",
      html: "<p>Lead JP</p>",
    })
  })

  it("não lança erro se o envio de email falhar", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP down"))

    await expect(
      notificarDestinatariosEmail({
        tipoPessoa: "PJ",
        assunto: "Lead",
        html: "<p>Lead</p>",
        destinatarios: [{ usuarioId: 1, nome: "Ana", email: "ana@empresa.com", celWhatsapp: "5519999999999" }],
      })
    ).resolves.toBeUndefined()
  })
})