// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { notificarDelecao } from "@/lib/notificar"
import { createQueryBuilder } from "@/test/route-db-mock"
import { DELETE } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn() },
}))

const session = { user: { name: "Tiago", role: "ADMIN" } }

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/cadastros/representantes/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    delete: vi.fn(() => createQueryBuilder([{ id: 3, nome: "Rep Teste" }])),
  }
}

describe("DELETE /api/cadastros/representantes/[id]", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.transaction = vi.fn((cb: any) => cb(txMock()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await del("3")
    expect(res.status).toBe(401)
  })

  it("retorna 403 para usuário não administrador", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: "Jo", role: "VENDEDOR" } } as any)
    const res = await del("3")
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas administradores podem excluir representantes" })
  })

  it("exclui o representante e seus vínculos em transação", async () => {
    const res = await del("3")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificarDelecao).toHaveBeenCalledWith("Representante", "Rep Teste", "Tiago")
  })

  it("retorna 404 quando o representante não existe", async () => {
    db.transaction = vi.fn((cb: any) => cb({ ...txMock(), delete: vi.fn(() => createQueryBuilder([])) }))
    const res = await del("999")
    expect(res.status).toBe(404)
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("3")
    expect(res.status).toBe(500)
  })
})
