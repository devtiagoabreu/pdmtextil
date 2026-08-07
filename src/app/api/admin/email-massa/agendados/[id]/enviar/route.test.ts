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

const agendado = {
  id: 4,
  nome: "07.08 | Feira Equipotel",
  para: "todos",
  assunto: "Promo",
  html: "<p>oi</p>",
  preheader: null,
  listas: null,
  modoEnvio: "individual",
  remetente: "sistema",
  agendadoPara: new Date("2026-08-07T12:00:00.000Z"),
  status: "agendado",
  enviadoEm: null,
  erro: null,
  criadoPor: 16,
  createdAt: new Date("2026-08-06T19:00:00.000Z"),
  updatedAt: new Date("2026-08-06T19:00:00.000Z"),
}

function post(id: string) {
  return POST(new NextRequest(`http://localhost/api/admin/email-massa/agendados/${id}/enviar`), {
    params: Promise.resolve({ id }),
  })
}

describe("POST /api/admin/email-massa/agendados/[id]/enviar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(criarDisparo).mockReset()
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await post("4")
    expect(res.status).toBe(401)
  })

  it("retorna 400 com id inválido", async () => {
    const res = await post("abc")
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando o agendamento não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await post("99")
    expect(res.status).toBe(404)
  })

  it("retorna 400 quando já foi enviado", async () => {
    db.select = vi.fn(() => createQueryBuilder([{ ...agendado, status: "enviado" }]))
    const res = await post("4")
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("já foi enviado")
  })

  it("cria o disparo e marca o agendamento como enviado", async () => {
    db.select = vi.fn(() => createQueryBuilder([agendado]))
    db.update = vi.fn(() => createQueryBuilder(undefined))
    vi.mocked(criarDisparo).mockResolvedValue({ id: 42, total: 4711, remessaId: "abc" } as any)

    const res = await post("4")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ disparoId: 42, total: 4711 })
    expect(criarDisparo).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "07.08 | Feira Equipotel", para: "todos", assunto: "Promo", criadoPor: 16 }),
    )
    expect(db.update).toHaveBeenCalled()
  })

  it("retorna 400 quando não há destinatários", async () => {
    db.select = vi.fn(() => createQueryBuilder([agendado]))
    vi.mocked(criarDisparo).mockResolvedValue(null)
    const res = await post("4")
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("Nenhum destinatário")
    expect(db.update).not.toHaveBeenCalled()
  })
})
