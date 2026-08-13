import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), transaction: vi.fn() } }))

const session = { user: { id: "16", role: "ADMIN" } }

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/email-massa/listas/7/contatos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/admin/email-massa/listas/[id]/contatos", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await POST(makeRequest({ contato: { nome: "Ana", email: "a@x.com" } }), {
      params: Promise.resolve({ id: "7" }),
    })
    expect(res.status).toBe(401)
  })

  it("separa múltiplos emails em uma linha por email ao salvar contatos", async () => {
    const insertBuilder = createQueryBuilder([{ id: 1 }])
    db.transaction = vi.fn(async (cb: any) =>
      cb({ delete: vi.fn(() => createQueryBuilder(undefined)), insert: vi.fn(() => insertBuilder) })
    )

    const res = await POST(
      makeRequest({ contatos: [{ nome: "TIAGO ABREU", email: "devtiagoabreu@gmail.com;faturamento@promodatextil.com.br" }] }),
      { params: Promise.resolve({ id: "7" }) }
    )

    expect(res.status).toBe(200)
    const values = (insertBuilder.values as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(values).toHaveLength(2)
    expect(values[0]).toMatchObject({ listaId: 7, nome: "TIAGO ABREU", email: "devtiagoabreu@gmail.com" })
    expect(values[1]).toMatchObject({ listaId: 7, nome: "TIAGO ABREU", email: "faturamento@promodatextil.com.br" })
  })

  it("separa também no contato único com vírgula", async () => {
    const insertBuilder = createQueryBuilder([{ id: 1 }])
    db.insert = vi.fn(() => insertBuilder)

    const res = await POST(makeRequest({ nome: "Ana", email: "a@x.com,b@x.com" }), {
      params: Promise.resolve({ id: "7" }),
    })

    expect(res.status).toBe(200)
    const values = (insertBuilder.values as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(values).toHaveLength(2)
    expect(values.map((v: any) => v.email)).toEqual(["a@x.com", "b@x.com"])
  })

  it("retorna 400 para email sem arroba", async () => {
    const res = await POST(makeRequest({ nome: "Ana", email: "sem-arroba" }), {
      params: Promise.resolve({ id: "7" }),
    })
    expect(res.status).toBe(400)
  })
})
