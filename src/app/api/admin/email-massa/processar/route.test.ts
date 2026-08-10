import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn() },
}))
vi.mock("@/lib/crypto", () => ({ decrypt: (v: string) => v }))
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn() },
}))

const session = { user: { id: "28", role: "ADMIN" } }

const disparo = {
  id: 2,
  nome: "07.08 | Feira Equipotel",
  para: "clientes",
  assunto: "Promo",
  preheader: null,
  html: "<p>oi</p>",
  modoEnvio: "individual",
  remetente: "sistema",
  criadoPor: 28,
  status: "enviando",
  total: 4711,
  enviados: 376,
  falhas: 0,
  erro: null,
  iniciadoEm: new Date(),
  concluidoEm: null,
}

const cfg = {
  id: 1,
  host: "smtp.gmail.com",
  port: 587,
  user: "pdmprotextil@gmail.com",
  pass: "apppass",
  fromName: "PDM Pro Moda Têxtil",
  ativo: true,
}

const pendente = {
  id: 100,
  disparoId: 2,
  email: "cliente@x.com",
  nome: "Cliente",
  assunto: "Promo",
  status: "pendente",
}

const limiteErr = new Error(
  "Data command failed: 550-5.4.5 Daily user sending limit exceeded. 6a1803df08f44-908a9352288sm - gsmtp",
) as any
limiteErr.responseCode = 550

const rateErr = new Error("421 4.7.0 Try again later, too many consecutive messages") as any
rateErr.responseCode = 421

function post(authHeader?: string) {
  const headers = new Headers()
  if (authHeader) headers.set("authorization", authHeader)
  return POST(new NextRequest("http://localhost/api/admin/email-massa/processar", { method: "POST", headers }))
}

function mockSelectSequence(...results: any[]) {
  db.select = vi.fn()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

function mockTransporter(sendMail: any) {
  const transporter = {
    verify: vi.fn().mockResolvedValue(true),
    sendMail,
    close: vi.fn(),
  }
  vi.mocked(nodemailer.createTransport).mockReturnValue(transporter as any)
  return transporter
}

describe("POST /api/admin/email-massa/processar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    delete process.env.CRON_SECRET
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão e sem cron secret", async () => {
    const res = await post()
    expect(res.status).toBe(401)
  })

  it("autoriza via cron secret e não processa nada sem disparos", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    mockSelectSequence([], [{ total: 0 }])
    const res = await post("Bearer s3cr3t")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      disparosProcessados: 0,
      enviados: 0,
      falhas: 0,
      restantes: 0,
      limiteTempo: false,
    })
  })

  it("pausa o disparo ao atingir o limite diário em vez de marcar erro", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    const transporter = mockTransporter(vi.fn().mockRejectedValue(limiteErr))
    mockSelectSequence([disparo], [cfg], [{ total: 0 }], [pendente], [{ total: 4335 }], [{ total: 4335 }])

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparosProcessados).toBe(1)
    expect(data.enviados).toBe(0)
    expect(data.falhas).toBe(0)
    expect(data.restantes).toBe(4335)

    expect(transporter.sendMail).toHaveBeenCalledTimes(1)

    const pausa = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "pausado")
    expect(pausa).toBeDefined()
    expect(pausa![0].erro).toContain("Daily user sending limit exceeded")
    expect(pausa![0].concluidoEm).toBeNull()
    expect(updBuilder.set.mock.calls.some((c: any[]) => c[0]?.status === "erro")).toBe(false)
  })

  it("pausa o disparo quando o limite diário configurado já foi atingido hoje", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    const transporter = mockTransporter(vi.fn())
    mockSelectSequence([disparo], [cfg], [{ total: 1500 }], [{ total: 4335 }])

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparosProcessados).toBe(1)
    expect(data.enviados).toBe(0)
    expect(transporter.sendMail).not.toHaveBeenCalled()
    expect(transporter.verify).not.toHaveBeenCalled()

    const pausa = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "pausado")
    expect(pausa).toBeDefined()
    expect(pausa![0].erro).toContain("Limite diário configurado atingido")
    expect(pausa![0].concluidoEm).toBeNull()
  })

  it("pausa o disparo quando atinge o limite diário configurado no meio do envio", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    const transporter = mockTransporter(vi.fn().mockResolvedValue(true))
    mockSelectSequence(
      [{ ...disparo, remetente: "usuario" }],
      [{ id: 1, usuarioId: 28, email: "contato@empresa.com", senhaApp: "apppass", host: "smtp.gmail.com", port: 587, ativo: true, limiteDiario: 1 }],
      [{ total: 0 }],
      [pendente],
      [{ total: 1 }],
      [{ total: 1 }],
    )

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.enviados).toBe(1)
    expect(data.restantes).toBe(1)

    const pausa = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "pausado")
    expect(pausa).toBeDefined()
    expect(pausa![0].erro).toContain("Limite diário configurado atingido (1)")
    expect(updBuilder.set.mock.calls.some((c: any[]) => c[0]?.status === "concluido")).toBe(false)
  })

  it("retoma um disparo pausado e conclui quando a fila zera", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    mockTransporter(vi.fn().mockResolvedValue(true))
    mockSelectSequence(
      [{ ...disparo, status: "pausado" }],
      [cfg],
      [{ total: 0 }],
      [pendente],
      [],
      [{ total: 0 }],
      [{ total: 0 }],
    )

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.enviados).toBe(1)
    expect(data.restantes).toBe(0)

    const concluido = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "concluido")
    expect(concluido).toBeDefined()
    const enviado = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "enviado")
    expect(enviado).toBeDefined()
  })

  it("pausa o disparo em falha transiente (421) em vez de marcar erro", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    mockTransporter(vi.fn().mockRejectedValue(rateErr))
    mockSelectSequence([disparo], [cfg], [{ total: 0 }], [pendente], [{ total: 4335 }], [{ total: 4335 }])

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparosProcessados).toBe(1)
    expect(data.enviados).toBe(0)
    expect(data.restantes).toBe(4335)

    const pausa = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "pausado")
    expect(pausa).toBeDefined()
    expect(pausa![0].erro).toContain("421")
    expect(pausa![0].concluidoEm).toBeNull()
    expect(updBuilder.set.mock.calls.some((c: any[]) => c[0]?.status === "erro")).toBe(false)
  })

  it("retoma disparo pausado por falha transiente quando o erro passa", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)

    const upd1 = createQueryBuilder(undefined)
    db.update = vi.fn(() => upd1)
    mockTransporter(vi.fn().mockRejectedValue(rateErr))
    mockSelectSequence([disparo], [cfg], [{ total: 0 }], [pendente], [{ total: 4335 }], [{ total: 4335 }])
    let res = await post()
    expect(res.status).toBe(200)
    expect(upd1.set.mock.calls.find((c: any[]) => c[0]?.status === "pausado")).toBeDefined()

    const upd2 = createQueryBuilder(undefined)
    db.update = vi.fn(() => upd2)
    mockTransporter(vi.fn().mockResolvedValue(true))
    mockSelectSequence(
      [{ ...disparo, status: "pausado", erro: rateErr.message }],
      [cfg],
      [{ total: 0 }],
      [pendente],
      [],
      [{ total: 0 }],
      [{ total: 0 }],
    )
    res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.enviados).toBe(1)
    expect(data.restantes).toBe(0)
    expect(upd2.set.mock.calls.find((c: any[]) => c[0]?.status === "enviado")).toBeDefined()
    expect(upd2.set.mock.calls.find((c: any[]) => c[0]?.status === "concluido")).toBeDefined()
  })

  it("retoma disparo em erro transitório legado (421) e conclui quando a fila zera", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    mockTransporter(vi.fn().mockResolvedValue(true))
    mockSelectSequence(
      [{ ...disparo, status: "erro", erro: "Data command failed: 421 4.3.0 Temporary System Problem" }],
      [cfg],
      [{ total: 0 }],
      [pendente],
      [],
      [{ total: 0 }],
      [{ total: 0 }],
    )

    const res = await post()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparosProcessados).toBe(1)
    expect(data.enviados).toBe(1)
    expect(data.restantes).toBe(0)

    const enviado = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "enviado")
    expect(enviado).toBeDefined()
    const concluido = updBuilder.set.mock.calls.find((c: any[]) => c[0]?.status === "concluido")
    expect(concluido).toBeDefined()
  })

  it("mantém erro permanente fora da fila de retomada", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const updBuilder = createQueryBuilder(undefined)
    db.update = vi.fn(() => updBuilder)
    mockTransporter(vi.fn())
    mockSelectSequence([], [{ total: 0 }])

    const res = await post()
    expect(res.status).toBe(200)
    expect(updBuilder.set.mock.calls.some((c: any[]) => c[0]?.status === "enviando")).toBe(false)
  })
})
