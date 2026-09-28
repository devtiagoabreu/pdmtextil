// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { DELETE, GET, PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({ registrarLog: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), update: vi.fn(), delete: vi.fn() } }))

const adminUser = {
  session: { user: { id: "10", role: "ADMIN", name: "Marcos" } },
  userId: 10,
}

const tecnicoUser = {
  session: { user: { id: "11", role: "Tecnico", name: "Ana" } },
  userId: 11,
}

const categoriaRow = {
  id: 1,
  codigo: "INCIDENTE",
  nome: "Incidente",
  cor: "red",
  ativo: true,
  ordem: 10,
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
}

function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/chamados/categorias/1", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const params = Promise.resolve({ id: "1" })

describe("GET /api/chamados/categorias/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(tecnicoUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await GET(request("GET"), { params })
    expect(res.status).toBe(401)
  })

  it("retorna a categoria", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    const res = await GET(request("GET"), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).codigo).toBe("INCIDENTE")
  })

  it("retorna 404 quando não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await GET(request("GET"), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe("Categoria não encontrada")
  })
})

describe("PUT /api/chamados/categorias/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    vi.mocked(registrarLog).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(tecnicoUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await PUT(request("PUT", { nome: "X" }), { params })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando a categoria não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await PUT(request("PUT", { nome: "Incidente Crítico" }), { params })
    expect(res.status).toBe(404)
  })

  it("atualiza apenas os campos enviados", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    db.update.mockReturnValueOnce(createQueryBuilder([{ ...categoriaRow, nome: "Incidente Crítico" }]))
    const res = await PUT(request("PUT", { nome: "Incidente Crítico" }), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).nome).toBe("Incidente Crítico")
    // apenas uma chamada de update: renomear o nome não propaga para tickets
    expect(db.update).toHaveBeenCalledTimes(1)
  })

  it("propaga o novo codigo para os chamados vinculados", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    db.update.mockReturnValueOnce(createQueryBuilder([{ ...categoriaRow, codigo: "FALHA" }]))
    db.update.mockReturnValueOnce(createQueryBuilder([]))
    const res = await PUT(request("PUT", { codigo: "Falha" }), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).codigo).toBe("FALHA")
    expect(db.update).toHaveBeenCalledTimes(2)
  })

  it("retorna 400 com payload inválido", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    const res = await PUT(request("PUT", { cor: 123 }), { params })
    expect(res.status).toBe(400)
  })
})

describe("DELETE /api/chamados/categorias/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    vi.mocked(registrarLog).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(adminUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await DELETE(request("DELETE"), { params })
    expect(res.status).toBe(401)
  })

  it("retorna 403 para usuário não administrador", async () => {
    vi.mocked(requireAuth).mockResolvedValue(tecnicoUser as any)
    const res = await DELETE(request("DELETE"), { params })
    expect(res.status).toBe(403)
  })

  it("retorna 404 quando a categoria não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await DELETE(request("DELETE"), { params })
    expect(res.status).toBe(404)
  })

  it("bloqueia exclusão com chamados vinculados", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    db.select.mockReturnValueOnce(createQueryBuilder([{ total: 3 }]))
    const res = await DELETE(request("DELETE"), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.fkError).toBe(true)
    expect(body.error).toMatch(/3 chamado\(s\)/)
    expect(db.delete).not.toHaveBeenCalled()
  })

  it("exclui quando não há chamados vinculados", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    db.select.mockReturnValueOnce(createQueryBuilder([{ total: 0 }]))
    db.delete.mockReturnValueOnce(createQueryBuilder([]))
    const res = await DELETE(request("DELETE"), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(db.delete).toHaveBeenCalledTimes(1)
  })
})
