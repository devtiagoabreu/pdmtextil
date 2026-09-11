// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { reunioesProjetos } from "@/lib/db/schema"
import { GET, PUT, DELETE } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionQualidade = { session: { user: { id: "2", role: "QUALIDADE", name: "Ana" } }, userId: 2 }
const sessionComercial = { session: { user: { id: "3", role: "COMERCIAL", name: "Jean" } }, userId: 3 }

const projetoRow = {
  id: 2,
  nome: "Systêxtil",
  descricao: null,
  dataInicio: null,
  dataFim: null,
  status: "EM_ANDAMENTO",
  cor: "#6366f1",
  ativo: true,
  createdAt: new Date("2026-09-10T10:00:00.000Z"),
  updatedAt: new Date("2026-09-10T10:00:00.000Z"),
}

function get(id = "2") {
  return GET(new NextRequest(`http://localhost/api/reunioes/projetos/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function put(id = "2", body: unknown) {
  return PUT(
    new NextRequest(`http://localhost/api/reunioes/projetos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

function del(id = "2") {
  return DELETE(new NextRequest(`http://localhost/api/reunioes/projetos/${id}`, { method: "DELETE" }), {
    params: Promise.resolve({ id }),
  })
}

describe("GET /api/reunioes/projetos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("retorna 404 para id inexistente", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get("999")
    expect(res.status).toBe(404)
  })

  it("retorna detalhe do projeto", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([projetoRow]))
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.projeto).toEqual(expect.objectContaining({ id: 2, nome: "Systêxtil" }))
  })
})

describe("PUT /api/reunioes/projetos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await put("2", { nome: "X" })
    expect(res.status).toBe(401)
  })

  it("retorna 403 para perfil sem permissão de escrita", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionQualidade as any)
    const res = await put("2", { nome: "X" })
    expect(res.status).toBe(403)
  })

  it("retorna 404 para projeto inexistente", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await put("999", { nome: "X" })
    expect(res.status).toBe(404)
  })

  it("retorna 400 para payload inválido", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([projetoRow]))
    const res = await put("2", {})
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "O nome do projeto é obrigatório." })
  })

  it("retorna 409 para nome duplicado em outro projeto", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([projetoRow]))
    db.select.mockReturnValueOnce(createQueryBuilder([{ id: 7 }]))
    const res = await put("2", { nome: "Bling" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "Já existe um projeto com esse nome." })
    expect(db.update).not.toHaveBeenCalled()
  })

  it("atualiza projeto com sucesso", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([projetoRow]))
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    db.update.mockReturnValueOnce(
      createQueryBuilder([{ ...projetoRow, nome: "Systêxtil Integração", status: "ENCERRADO" }])
    )

    const res = await put("2", { nome: "Systêxtil Integração", status: "ENCERRADO" })
    expect(res.status).toBe(200)
    expect(db.update).toHaveBeenCalledWith(reunioesProjetos)
    const body = await res.json()
    expect(body.projeto).toEqual(expect.objectContaining({ id: 2, nome: "Systêxtil Integração" }))
  })
})

describe("DELETE /api/reunioes/projetos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await del()
    expect(res.status).toBe(401)
  })

  it("retorna 403 para perfil sem permissão de exclusão", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionComercial as any)
    const res = await del()
    expect(res.status).toBe(403)
  })

  it("retorna 404 para projeto inexistente", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await del("999")
    expect(res.status).toBe(404)
  })

  it("bloqueia exclusão do projeto padrão", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ ...projetoRow, id: 1, nome: "Interna" }]))
    const res = await del("1")
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "O projeto padrão não pode ser excluído." })
    expect(db.delete).not.toHaveBeenCalled()
  })

  it("bloqueia exclusão com reuniões vinculadas", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([projetoRow]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 3 }]))
    const res = await del("2")
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Não é possível excluir: há reuniões vinculadas a este projeto." })
    expect(db.delete).not.toHaveBeenCalled()
  })

  it("exclui projeto sem reuniões vinculadas", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([projetoRow]))
      .mockReturnValueOnce(createQueryBuilder([]))
    db.delete.mockReturnValueOnce(createQueryBuilder([projetoRow]))

    const res = await del("2")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(db.delete).toHaveBeenCalledWith(reunioesProjetos)
  })
})