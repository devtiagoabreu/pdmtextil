import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseEmails, montarLinkDescadastro, injectUnsubscribe, buscarDestinatarios } from "./email-massa"
import { db } from "./db"
import { createQueryBuilder } from "@/test/route-db-mock"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))

describe("parseEmails", () => {
  it("retorna lista vazia para campo nulo/vazio", () => {
    expect(parseEmails(null)).toEqual([])
    expect(parseEmails("")).toEqual([])
    expect(parseEmails("   ")).toEqual([])
  })

  it("divide por vírgula, ponto-e-vírgula e quebra de linha", () => {
    expect(parseEmails("a@x.com, b@y.com; c@z.com\nd@w.com")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
      "d@w.com",
    ])
  })

  it("descarta emails malformados", () => {
    expect(parseEmails("valido@x.com, invalido, @semnome.com, sem@dominio, ruim@x.")).toEqual([
      "valido@x.com",
    ])
  })

  it("remove duplicatas", () => {
    expect(parseEmails("A@X.com, a@x.com, a@x.com")).toEqual(["A@X.com"])
  })
})

describe("montarLinkDescadastro / injectUnsubscribe", () => {
  it("monta o link com o email do destinatário", () => {
    const link = montarLinkDescadastro("cliente@x.com", "https://pdmprotextil.vercel.app")
    expect(link).toContain("/api/email/unsubscribe?email=cliente%40x.com")
  })

  it("injeta o bloco de descadastro antes de </body>", () => {
    const html = injectUnsubscribe("<html><body><p>Oi</p></body></html>", "c@x.com", "https://app.com")
    expect(html).toContain("/api/email/unsubscribe?email=c%40x.com")
    expect(html).toContain("cancelar inscrição")
    expect(html).toContain("</body>")
    expect(html.indexOf("cancelar inscrição")).toBeLessThan(html.indexOf("</body>"))
  })

  it("injeta o bloco no final quando não há </body>", () => {
    const html = injectUnsubscribe("<p>Oi</p>", "c@x.com", "https://app.com")
    expect(html).toContain("cancelar inscrição")
    expect(html.endsWith("</div>")).toBe(true)
  })
})

describe("buscarDestinatarios", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset()
  })

  it("filtra emails inválidos e optouts em clientes", async () => {
    vi.mocked(db.select)
      .mockImplementationOnce(() =>
        createQueryBuilder([{ email: "ok@x.com", nome: "A" }, { email: "ruim", nome: "B" }, { email: "fora@x.com", nome: "C" }]),
      )
      .mockImplementationOnce(() => createQueryBuilder([{ email: "FORA@x.com" }]))
    const result = await buscarDestinatarios("clientes")
    expect(result).toEqual([{ email: "ok@x.com", nome: "A" }])
  })

  it("não consulta optouts quando não há destinatários", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder([]))
    const result = await buscarDestinatarios("clientes")
    expect(result).toEqual([])
    expect(vi.mocked(db.select)).toHaveBeenCalledTimes(1)
  })

  it("retorna lista vazia para tipo desconhecido", async () => {
    const result = await buscarDestinatarios("inexistente")
    expect(result).toEqual([])
    expect(vi.mocked(db.select)).not.toHaveBeenCalled()
  })
})
