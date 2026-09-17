// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

const sessionUser = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const abertoRow = {
  id: 1,
  status: "ABERTO",
  prioridade: "URGENTE",
  slaPrimeiraRespostaPrazo: new Date(Date.now() - 1000 * 60 * 60),
  slaResolucaoPrazo: new Date(Date.now() + 1000 * 60 * 60),
  primeiraRespostaEm: null,
  areaId: 2,
  areaNome: "TI",
  responsavelId: null,
}

function get() {
  return GET(new NextRequest("http://localhost/api/chamados/dashboard"))
}

describe("GET /api/chamados/dashboard", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("agrega totais, filas e recentes", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([abertoRow]))
      .mockReturnValueOnce(createQueryBuilder([{ n: 1 }]))
      .mockReturnValueOnce(createQueryBuilder([{ n: 0 }]))
      .mockReturnValueOnce(createQueryBuilder([{ n: 0 }]))
      .mockReturnValueOnce(createQueryBuilder([]))
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totais.abertos).toBe(1)
    expect(body.totais.resolvidosMes).toBe(1)
    expect(body.totais.vencidosPrimeiraResposta).toBe(1)
    expect(body.porFila).toHaveLength(1)
    expect(body.porFila[0].areaNome).toBe("TI")
    expect(body.recentes).toEqual([])
  })
})