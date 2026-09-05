// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
import { db } from "@/lib/db"
import { adquirirLockConversa } from "./conversation-lock"
import { createQueryBuilder } from "@/test/route-db-mock"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() } }))

function setupMock(lead: any) {
  const selectResults = [createQueryBuilder([]), createQueryBuilder(lead ? [lead] : [])]
  let selectIndex = 0
  const insertBuilder = createQueryBuilder([{ id: 99 }])
  db.select.mockImplementation(() => selectResults[selectIndex++])
  db.update.mockReturnValue(createQueryBuilder([]))
  db.insert.mockReturnValue(insertBuilder)
  return insertBuilder
}

describe("adquirirLockConversa — lead existente retornando", () => {
  it("lead existente SEM empresaNome → estado inicial AGUARDANDO_REPRESENTANTE", async () => {
    const insertBuilder = setupMock({ id: 9, nome: "Maria", empresaNome: null, tipoPessoa: "PF" })

    const res = await adquirirLockConversa("5519999999999@s.whatsapp.net")

    expect(res).toEqual({ token: expect.any(String), criada: true, leadExistente: true })
    const values = insertBuilder.values.mock.calls[0][0]
    expect(values.estado).toBe("AGUARDANDO_REPRESENTANTE")
    expect(values.dados).toMatchObject({ tipoPessoa: "PF" })
    expect(values.dados.razaoSocial).toBeUndefined()
  })

  it("lead existente COM empresaNome → estado inicial AGUARDANDO_REPRESENTANTE com razaoSocial", async () => {
    const insertBuilder = setupMock({ id: 9, nome: "Loja X", empresaNome: "Loja X LTDA", tipoPessoa: "PJ" })

    const res = await adquirirLockConversa("5519999999999@s.whatsapp.net")

    expect(res).toEqual({ token: expect.any(String), criada: true, leadExistente: true })
    const values = insertBuilder.values.mock.calls[0][0] as any
    expect(values.estado).toBe("AGUARDANDO_REPRESENTANTE")
    expect(values.dados.razaoSocial).toBe("Loja X LTDA")
  })
})