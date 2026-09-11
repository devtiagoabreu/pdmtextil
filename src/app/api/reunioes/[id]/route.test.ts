// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { notificarDelecao } from "@/lib/notificar"
import { reunioes } from "@/lib/db/schema"
import { GET, PUT, DELETE } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), delete: vi.fn(), transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionQualidade = { session: { user: { id: "2", role: "QUALIDADE", name: "Ana" } }, userId: 2 }
const sessionComercial = { session: { user: { id: "3", role: "COMERCIAL", name: "Jean" } }, userId: 3 }

const reuniaoRow = {
  id: 3,
  titulo: "Rodada 15 — release notes 2026",
  projetoId: 2,
  data: new Date("2026-09-11T15:00:00.000Z"),
  local: "Meet",
  status: "REALIZADA",
  resumoCurto: null,
  resumoDetalhado: null,
  resumoItensAcao: null,
  transcricao: null,
  videoUrl: "https://meet.google.com/abc",
  createdAt: new Date("2026-09-10T10:00:00.000Z"),
  updatedAt: new Date("2026-09-10T10:00:00.000Z"),
}

function mockDetalhe() {
  db.select
    .mockReturnValueOnce(createQueryBuilder([reuniaoRow]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 2, nome: "Systêxtil", status: "EM_ANDAMENTO" }]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, conteudo: "Ata dt", criadoPor: "Tiago" }]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, ordem: 1, descricao: "Item 1" }]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, nome: "Fulano", empresa: "X", papel: "Dev" }]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, descricao: "Tarefa", responsavel: "Jean", prazo: null, status: "PENDENTE" }]))
    .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, rotulo: "Release notes", url: "https://x", descricao: null, ordem: 1 }]))
}

function get(id = "3") {
  return GET(new NextRequest(`http://localhost/api/reunioes/${id}`), { params: Promise.resolve({ id }) })
}

function put(id = "3", body: unknown) {
  return PUT(
    new NextRequest(`http://localhost/api/reunioes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

function del(id = "3") {
  return DELETE(new NextRequest(`http://localhost/api/reunioes/${id}`, { method: "DELETE" }), {
    params: Promise.resolve({ id }),
  })
}

describe("GET /api/reunioes/[id]", () => {
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

  it("retorna detalhe completo da reunião", async () => {
    mockDetalhe()
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reuniao.id).toBe(3)
    expect(body.reuniao.ata.conteudo).toBe("Ata dt")
    expect(body.reuniao.pautas).toHaveLength(1)
    expect(body.reuniao.encaminhamentos[0].status).toBe("PENDENTE")
    expect(body.reuniao.links).toHaveLength(1)
  })
})

describe("PUT /api/reunioes/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    db.transaction = vi.fn((cb: any) => cb({ insert: vi.fn(), update: vi.fn(), delete: vi.fn() }))
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await put("3", { titulo: "X" })
    expect(res.status).toBe(401)
  })

  it("retorna 403 para perfil sem permissão de escrita", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionQualidade as any)
    const res = await put("3", { titulo: "X", data: "2026-09-11T15:00:00.000Z" })
    expect(res.status).toBe(403)
  })

  it("retorna 400 para payload inválido", async () => {
    const res = await put("3", { data: "2026-09-11T15:00:00.000Z" })
    expect(res.status).toBe(400)
  })

  it("atualiza reunião de forma destrutiva em transação", async () => {
    const tx = {
      update: vi.fn(() => createQueryBuilder([reuniaoRow])),
      delete: vi.fn(() => createQueryBuilder([])),
      insert: vi.fn(() => createQueryBuilder([{ id: 9 }])),
    }
    db.transaction = vi.fn((cb: any) => cb(tx))
    mockDetalhe()

    const res = await put("3", {
      titulo: "Rodada 15 — release notes 2026",
      projetoId: 2,
      data: "2026-09-11T15:00:00.000Z",
      local: "Meet",
      status: "REALIZADA",
      videoUrl: "https://meet.google.com/abc",
      pautas: [{ descricao: "Item 1" }],
    })

    expect(res.status).toBe(200)
    expect(db.transaction).toHaveBeenCalled()
    expect(tx.update).toHaveBeenCalledWith(reunioes)
    const body = await res.json()
    expect(body.reuniao.titulo).toBe("Rodada 15 — release notes 2026")
  })
})

describe("DELETE /api/reunioes/[id]", () => {
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

  it("retorna 404 para id inexistente", async () => {
    db.delete.mockReturnValueOnce(createQueryBuilder([]))
    const res = await del("999")
    expect(res.status).toBe(404)
  })

  it("exclui reunião e notifica deleção", async () => {
    db.delete.mockReturnValueOnce(createQueryBuilder([reuniaoRow]))
    const res = await del()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(vi.mocked(notificarDelecao)).toHaveBeenCalledWith("Reunião", "Rodada 15 — release notes 2026", "Tiago")
  })
})