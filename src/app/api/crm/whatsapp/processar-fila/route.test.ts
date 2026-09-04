// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { executarFluxo, marcarFilaStatus } from "@/lib/whatsapp/processador"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn() },
}))
vi.mock("@/lib/whatsapp/processador", () => ({
  executarFluxo: vi.fn(),
  marcarFilaStatus: vi.fn(),
}))

const session = { user: { id: "28", role: "ADMIN" } }

const filaItem = {
  id: 7,
  remoteJid: "5519988887777@s.whatsapp.net",
  pushName: "Maria",
  mensagem: "Oi",
  executionId: "x",
  payload: { rawText: "{\"data\":{\"key\":{\"remoteJid\":\"5519988887777@s.whatsapp.net\"}},\"texto\":\"Oi\"}" },
  status: "PENDENTE",
  tentativas: 0,
  maxTentativas: 3,
  ultimoErro: null,
  processadoEm: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function post(authHeader?: string) {
  const headers = new Headers()
  if (authHeader) headers.set("authorization", authHeader)
  return POST(new NextRequest("http://localhost/api/crm/whatsapp/processar-fila", { method: "POST", headers }))
}

const filaItemStaleProcessando = {
  ...filaItem,
  id: 8,
  status: "PROCESSANDO",
  updatedAt: new Date(Date.now() - 10 * 60 * 1000),
}

describe("POST /api/crm/whatsapp/processar-fila (drain)", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    delete process.env.CRON_SECRET
    process.env.PDM_WEBHOOK_SECRET = "webhook-sec"
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    vi.mocked(executarFluxo).mockReset()
    vi.mocked(marcarFilaStatus).mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão e sem cron secret", async () => {
    const res = await post()
    expect(res.status).toBe(401)
  })

  it("autoriza via cron secret e reprocessa itens pendentes", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    vi.mocked(executarFluxo).mockResolvedValue(NextResponse.json({ ok: true }) as any)
    db.select = vi.fn()
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([filaItem]))

    const res = await post("Bearer s3cr3t")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.processadas).toBe(1)
    expect(json.comErro).toBe(0)
    expect(executarFluxo).toHaveBeenCalledWith(expect.any(Object), 7)
  })

  it("marca FALHOU quando executarFluxo devolve erro", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    vi.mocked(executarFluxo).mockResolvedValue(NextResponse.json({ error: "x" }, { status: 500 }) as any)
    db.select = vi.fn()
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([filaItem]))

    const res = await post("Bearer s3cr3t")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.processadas).toBe(0)
    expect(json.comErro).toBe(1)
  })

  it("reprocessa item PROCESSANDO preso (stale) há mais de 3 minutos", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    vi.mocked(executarFluxo).mockResolvedValue(NextResponse.json({ ok: true }) as any)
    db.select = vi.fn()
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([filaItemStaleProcessando]))

    const res = await post("Bearer s3cr3t")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.processadas).toBe(1)
    expect(executarFluxo).toHaveBeenCalledWith(expect.any(Object), 8)
  })
})
