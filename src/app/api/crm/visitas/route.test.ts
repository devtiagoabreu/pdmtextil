// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { geocodificarCamposEndereco } from "@/lib/crm/geocode"
import { createDbMock, createQueryBuilder } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn(), transaction: vi.fn() },
}))
vi.mock("@/lib/crm/geocode", () => ({ geocodificarCamposEndereco: vi.fn() }))
vi.mock("@/lib/notificar", () => ({ registrarLog: vi.fn(), notificar: vi.fn() }))
vi.mock("@/lib/crm-timeline", () => ({ inserirTimelineEvento: vi.fn() }))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function visitaInserted(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    dataVisita: "2026-08-10",
    hora: "09:00",
    tipo: "PRESENCIAL",
    status: "AGENDADA",
    endereco: "Av. X",
    numero: "100",
    complemento: null,
    bairro: "Centro",
    cidade: "Goiânia",
    uf: "GO",
    cep: null,
    ...overrides,
  }
}

describe("POST /api/crm/visitas", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    vi.mocked(geocodificarCamposEndereco).mockReset()
    resetAllDb()
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue(null)
  })

  function resetAllDb() {
    for (const key of ["select", "insert", "update"] as const) {
      ;(db[key] as ReturnType<typeof vi.fn>)?.mockReset()
    }
  }

  function mockInsert(rows: Record<string, any>[]) {
    ;(db.insert as ReturnType<typeof vi.fn>).mockReturnValue(createQueryBuilder(rows))
  }

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await POST(new NextRequest("http://localhost/api/crm/visitas", { method: "POST", body: JSON.stringify({}) }))
    expect(res.status).toBe(401)
  })

  it("geocodifica o endereço da visita e salva as coordenadas no cadastro", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -16.82, longitude: -49.25 })
    mockInsert([visitaInserted(1)])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(createQueryBuilder(undefined))

    const res = await POST(
      new NextRequest("http://localhost/api/crm/visitas", {
        method: "POST",
        body: JSON.stringify({
          dataVisita: "2026-08-10",
          endereco: "Av. X",
          numero: "100",
          bairro: "Centro",
          cidade: "Goiânia",
          uf: "GO",
        }),
      })
    )

    expect(res.status).toBe(201)
    expect(geocodificarCamposEndereco).toHaveBeenCalledWith({ endereco: "Av. X", numero: "100", complemento: null, bairro: "Centro", cidade: "Goiânia", uf: "GO" })
    expect(db.update).toHaveBeenCalledTimes(1)
    const body = await res.json()
    expect(body.visita.enderecoLat).toBe(-16.82)
    expect(body.visita.enderecoLng).toBe(-49.25)
  })

  it("geocodifica uma única vez e aplica as coordenadas em todas as recorrências", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -16.82, longitude: -49.25 })
    mockInsert([visitaInserted(1), visitaInserted(2, { id: 2, dataVisita: "2026-08-17" }), visitaInserted(3, { id: 3, dataVisita: "2026-08-24" })])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(createQueryBuilder(undefined))

    const res = await POST(
      new NextRequest("http://localhost/api/crm/visitas", {
        method: "POST",
        body: JSON.stringify({
          dataVisita: "2026-08-10",
          recorrencia: "semanal",
          recorrenciaFim: "2026-08-30",
          endereco: "Av. X",
          numero: "100",
          bairro: "Centro",
          cidade: "Goiânia",
          uf: "GO",
        }),
      })
    )

    expect(res.status).toBe(201)
    expect(geocodificarCamposEndereco).toHaveBeenCalledTimes(1)
    const body = await res.json()
    expect(body.total).toBe(3)
  })

  it("usa o endereço da pessoa (empresa) quando a visita não tem endereço", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -16.68, longitude: -49.26 })
    mockInsert([visitaInserted(1, { endereco: null, numero: null, bairro: null, cidade: null, uf: null })])

    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        { endereco: "Av. das Empresas", numero: "500", complemento: null, bairro: "Industrial", cidade: "Aparecida de Goiânia", uf: "GO" },
      ])
    )
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(createQueryBuilder(undefined))

    const res = await POST(
      new NextRequest("http://localhost/api/crm/visitas", {
        method: "POST",
        body: JSON.stringify({ dataVisita: "2026-08-10", empresaId: 9, endereco: null }),
      })
    )

    expect(res.status).toBe(201)
    expect(geocodificarCamposEndereco).toHaveBeenCalledWith({ endereco: "Av. das Empresas", numero: "500", complemento: null, bairro: "Industrial", cidade: "Aparecida de Goiânia", uf: "GO" })
  })

  it("não geocodifica nem atualiza quando não há endereço em nenhuma origem", async () => {
    mockInsert([visitaInserted(1, { endereco: null, numero: null, bairro: null, cidade: null, uf: null })])

    const update = db.update as ReturnType<typeof vi.fn>
    const res = await POST(
      new NextRequest("http://localhost/api/crm/visitas", {
        method: "POST",
        body: JSON.stringify({ dataVisita: "2026-08-10", endereco: null }),
      })
    )

    expect(res.status).toBe(201)
    expect(geocodificarCamposEndereco).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.visita.enderecoLat).toBeUndefined()
  })
})