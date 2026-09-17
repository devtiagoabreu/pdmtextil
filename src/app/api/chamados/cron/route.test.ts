// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/chamados/notificar", () => ({
  notificarChamado: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

const ticketRow = {
  id: 3,
  titulo: "Computador não liga",
  status: "ABERTO",
  slaPrimeiraRespostaPrazo: new Date(Date.now() - 1000 * 60 * 60),
  slaResolucaoPrazo: new Date(Date.now() + 1000 * 60 * 60),
  primeiraRespostaEm: null,
  solicitanteId: 5,
}

function cronFetch(authHeader?: string) {
  const req = new NextRequest("http://localhost/api/chamados/cron", {
    method: "POST",
    headers: authHeader ? { authorization: authHeader } : {},
  })
  return POST(req)
}

describe("POST /api/chamados/cron", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  it("retorna 401 sem CRON_SECRET e sem sessão admin", async () => {
    const res = await cronFetch("Bearer errado")
    expect(res.status).toBe(401)
  })

  it("aceita CRON_SECRET e sinaliza SLA estourado", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    db.select
      .mockReturnValueOnce(createQueryBuilder([ticketRow]))
      .mockReturnValueOnce(createQueryBuilder([]))
    db.insert.mockReturnValueOnce(createQueryBuilder([{}]))
    const res = await cronFetch(`Bearer ${process.env.CRON_SECRET}`)
    delete process.env.CRON_SECRET
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.verificados).toBe(1)
    expect(body.mensagensCriadas).toBe(1)
  })

  it("não duplica alerta já sinalizado", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    db.select
      .mockReturnValueOnce(createQueryBuilder([ticketRow]))
      .mockReturnValueOnce(
        createQueryBuilder([{ ticketId: 3, mensagem: "[SLA] SLA_ALERTA_PRIMEIRA_RESPOSTA" }])
      )
    const res = await cronFetch(`Bearer ${process.env.CRON_SECRET}`)
    delete process.env.CRON_SECRET
    expect(res.status).toBe(200)
    expect((await res.json()).mensagensCriadas).toBe(0)
  })
})