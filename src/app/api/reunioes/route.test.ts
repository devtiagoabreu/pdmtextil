// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { reunioes } from "@/lib/db/schema"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionQualidade = { session: { user: { id: "2", role: "QUALIDADE", name: "Ana" } }, userId: 2 }

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

function get(url: string) {
  return GET(new NextRequest(url))
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/reunioes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/reunioes", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get("http://localhost/api/reunioes")
    expect(res.status).toBe(401)
  })

  it("lista reuniões com agregados e links", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([reuniaoRow]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 10, reuniaoId: 3, rotulo: "Release notes", url: "https://x", descricao: null, ordem: 1 }]))
      .mockReturnValueOnce(createQueryBuilder([{ reuniaoId: 3 }, { reuniaoId: 3 }]))
      .mockReturnValueOnce(createQueryBuilder([{ reuniaoId: 3 }, { reuniaoId: 3 }, { reuniaoId: 3 }]))
      .mockReturnValueOnce(createQueryBuilder([{ reuniaoId: 3 }, { reuniaoId: 3 }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 2, nome: "Systêxtil", status: "EM_ANDAMENTO" }]))

    const res = await get("http://localhost/api/reunioes")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reunioes).toHaveLength(1)
    const item = body.reunioes[0]
    expect(item.titulo).toBe("Rodada 15 — release notes 2026")
    expect(item.projetoNome).toBe("Systêxtil")
    expect(item.links).toHaveLength(1)
    expect(item.links[0].rotulo).toBe("Release notes")
    expect(item._count).toEqual({ pautas: 2, participantes: 3, encaminhamentos: 2, links: 1 })
  })

  it("retorna lista vazia quando não há reuniões", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get("http://localhost/api/reunioes")
    expect(res.status).toBe(200)
    expect((await res.json()).reunioes).toEqual([])
  })
})

describe("POST /api/reunioes", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    db.transaction = vi.fn((cb: any) => cb({ insert: vi.fn(() => createQueryBuilder([{ id: 3, titulo: "Rodada 15" }])) }))
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ titulo: "Rodada 15" })
    expect(res.status).toBe(401)
  })

  it("retorna 403 para perfil sem permissão de escrita", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionQualidade as any)
    const res = await post({
      titulo: "Rodada 15",
      data: "2026-09-11T15:00:00.000Z",
    })
    expect(res.status).toBe(403)
  })

  it("retorna 400 sem título", async () => {
    const res = await post({ data: "2026-09-11T15:00:00.000Z" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "O título da reunião é obrigatório." })
  })

  it("retorna 400 com link inválido", async () => {
    const res = await post({
      titulo: "Rodada 15",
      projetoId: 2,
      data: "2026-09-11T15:00:00.000Z",
      videoUrl: "meet.google.com/abc",
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Link inválido." })
  })

  it("cria reunião com todos os blocos em transação", async () => {
    const tx = { insert: vi.fn(() => createQueryBuilder([{ id: 3, titulo: "Rodada 15" }])) }
    db.transaction = vi.fn((cb: any) => cb(tx))

    db.select
      .mockReturnValueOnce(createQueryBuilder([reuniaoRow]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 2, nome: "Systêxtil", status: "EM_ANDAMENTO" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, conteudo: "Conteúdo da ata", criadoPor: "Tiago" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, ordem: 1, descricao: "Item 1" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, nome: "Fulano", empresa: "X", papel: "Dev" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, descricao: "Tarefa", responsavel: "Jean", prazo: null, status: "PENDENTE" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, reuniaoId: 3, rotulo: "Release notes", url: "https://x", descricao: null, ordem: 1 }]))

    const res = await post({
      titulo: "Rodada 15 — release notes 2026",
      projetoId: 2,
      data: "2026-09-11T15:00:00.000Z",
      local: "Meet",
      status: "REALIZADA",
      resumoCurto: "Uma frase",
      ata: "Conteúdo da ata",
      videoUrl: "https://meet.google.com/abc",
      pautas: [{ descricao: "Item 1" }],
      participantes: [{ nome: "Fulano", empresa: "X", papel: "Dev" }],
      encaminhamentos: [{ descricao: "Tarefa", responsavel: "Jean", prazo: "2026-10-01T12:00:00.000Z", status: "PENDENTE" }],
      links: [{ rotulo: "Release notes", url: "https://x", descricao: null }],
    })

    expect(res.status).toBe(201)
    expect(db.transaction).toHaveBeenCalled()
    expect(tx.insert).toHaveBeenCalledWith(reunioes)
    expect(await res.json()).toEqual({
      reuniao: expect.objectContaining({
        id: 3,
        titulo: "Rodada 15 — release notes 2026",
        ata: { conteudo: "Conteúdo da ata", criadoPor: "Tiago" },
        pautas: [{ id: 1, reuniaoId: 3, ordem: 1, descricao: "Item 1" }],
      }),
    })
  })
})