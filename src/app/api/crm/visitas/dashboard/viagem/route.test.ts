// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const viagem = {
  id: 7,
  titulo: "Viagem Goiania - Ernandes",
  descricao: null,
  destinoCidade: "Goiânia",
  destinoUf: "GO",
  dataInicio: "2026-08-10",
  dataFim: "2026-08-12",
  status: "REALIZADA",
}

function visitaRow(id: number, extra: Record<string, unknown>) {
  return {
    id,
    empresaId: id,
    empresaNome: null,
    clienteId: null,
    clienteNome: "Cliente Teste",
    nomeAvulso: null,
    dataVisita: "2026-08-10",
    hora: "09:00",
    tipo: "PRESENCIAL",
    status: "REALIZADA",
    endereco: "Av. X",
    numero: "100",
    complemento: null,
    bairro: "Centro",
    cidade: "Goiânia",
    uf: "GO",
    checkInTime: new Date("2026-08-10T12:00:00Z"),
    checkOutTime: new Date("2026-08-10T13:00:00Z"),
    checkInLat: null,
    checkInLng: null,
    checkOutLat: null,
    checkOutLng: null,
    ...extra,
  }
}

describe("GET /api/crm/visitas/dashboard/viagem", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem viagemId", async () => {
    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem"))
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando a viagem não existe", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([]))
    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=99"))
    expect(res.status).toBe(404)
  })

  it("monta o cronograma com trajeto e kilometragem total", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(11, { hora: "09:00", checkInLat: -23.55, checkInLng: -46.63, checkOutLat: -23.56, checkOutLng: -46.64 }),
        visitaRow(12, { hora: "11:00", checkInLat: -22.90, checkInLng: -43.17, checkOutLat: -22.91, checkOutLng: -43.18 }),
        visitaRow(13, { hora: "15:00", status: "CANCELADA" }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.viagem.titulo).toBe("Viagem Goiania - Ernandes")
    expect(body.visitas).toHaveLength(3)
    expect(body.visitas[0]).toMatchObject({ id: 11, nome: "Cliente Teste", km: 0 })
    expect(body.visitas[0].latitude).toBe(-23.55)
    expect(body.visitas[1].km).toBeGreaterThan(340)
    expect(body.visitas[1].km).toBeLessThan(380)
    expect(body.visitas[1].latitude).toBe(-22.9)
    expect(body.visitas[2]).toMatchObject({ id: 13, status: "CANCELADA", latitude: null, longitude: null, km: null })
    expect(body.visitas[2].enderecoTexto).toContain("Goiânia")

    expect(body.resumo).toMatchObject({
      total: 3,
      realizadas: 2,
      canceladas: 1,
      agendadas: 0,
      comLocalizacao: 2,
      kmSemLocalizacao: 1,
    })
    expect(body.resumo.kmTotal).toBeCloseTo(body.visitas[1].km, 0)
  })

  it("usa check-out quando não há check-in", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(21, { checkOutLat: -23.55, checkOutLng: -46.63 }),
        visitaRow(22, { checkOutLat: -23.55, checkOutLng: -46.63 }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()
    expect(body.visitas[0].latitude).toBe(-23.55)
    expect(body.resumo.comLocalizacao).toBe(2)
    expect(body.resumo.kmTotal).toBe(0)
  })
})