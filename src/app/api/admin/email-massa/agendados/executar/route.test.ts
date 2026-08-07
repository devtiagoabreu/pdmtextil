import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { criarDisparo } from "@/lib/email-massa"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock("@/lib/email-massa", () => ({ criarDisparo: vi.fn() }))

const session = { user: { id: "16", role: "ADMIN" } }

const pendente = {
  id: 1,
  nome: "Campanha",
  para: "todos",
  assunto: "Promo",
  html: "<p>oi</p>",
  preheader: null,
  listas: null,
  modoEnvio: "bcc",
  remetente: "sistema",
  criadoPor: 16,
  agendadoPara: new Date("2026-08-07T12:00:00.000Z"),
  status: "agendado",
  enviadoEm: null,
  erro: null,
  createdAt: new Date("2026-08-06T19:00:00.000Z"),
  updatedAt: new Date("2026-08-06T19:00:00.000Z"),
}

function post(authHeader?: string) {
  const headers = new Headers()
  if (authHeader) headers.set("authorization", authHeader)
  return POST(new NextRequest("http://localhost/api/admin/email-massa/agendados/executar", { method: "POST", headers }))
}

describe("POST /api/admin/email-massa/agendados/executar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(criarDisparo).mockReset()
    delete process.env.CRON_SECRET
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão e sem cron secret", async () => {
    db.select = vi.fn(() => createQueryBuilder([pendente]))
    const res = await post()
    expect(res.status).toBe(401)
  })

  it("retorna 200 com nenhum agendamento pendente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await post()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ executados: 0, message: "Nenhum agendamento pendente" })
    expect(criarDisparo).not.toHaveBeenCalled()
  })

  it("admin executa o agendamento vencido e cria o disparo", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.select = vi.fn(() => createQueryBuilder([pendente]))
    db.update = vi.fn(() => createQueryBuilder(undefined))
    vi.mocked(criarDisparo).mockResolvedValue({ id: 99 } as any)

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.executados).toBe(1)
    expect(criarDisparo).toHaveBeenCalledTimes(1)
    expect(criarDisparo).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Campanha", para: "todos", assunto: "Promo", criadoPor: 16 }),
    )
    expect(db.update).toHaveBeenCalled()
  })

  it("autoriza via cron secret mesmo sem sessão", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await post("Bearer s3cr3t")
    expect(res.status).toBe(200)
  })

  it("marca erro quando o disparo não tem destinatários", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.select = vi.fn(() => createQueryBuilder([pendente]))
    db.update = vi.fn(() => createQueryBuilder(undefined))
    vi.mocked(criarDisparo).mockResolvedValue(null)

    const res = await post()
    const data = await res.json()
    expect(data.executados).toBe(0)
    expect(data.erros[0]).toContain("Nenhum destinatário encontrado")
  })
})
