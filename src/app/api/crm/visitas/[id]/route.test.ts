// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificarDelecao } from "@/lib/notificar"
import { geocodificarEndereco } from "@/lib/crm/geocode"
import { createDbMock, createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { DELETE, PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn(), transaction: vi.fn() },
}))
vi.mock("@/lib/crm/geocode", () => ({ geocodificarEndereco: vi.fn() }))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/crm/visitas/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    select: vi.fn(() => createQueryBuilder([])),
    delete: vi.fn(() => createQueryBuilder(undefined)),
  }
}

function visitaExistente(overrides: Record<string, any> = {}) {
  return {
    id: 10,
    empresaId: null,
    clienteId: null,
    oportunidadeId: null,
    contatoId: null,
    viagemId: null,
    representanteId: null,
    propostaId: null,
    nomeAvulso: null,
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
    enderecoLat: null,
    enderecoLng: null,
    motivoCancelamento: null,
    relato: null,
    fotos: [],
    duracaoEstimada: null,
    ...overrides,
  }
}

describe("DELETE /api/crm/visitas/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    db.select = vi.fn(() => createQueryBuilder([]))
    db.transaction = vi.fn((cb: any) => cb(txMock()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await del("1")
    expect(res.status).toBe(401)
  })

  it("retorna 403 para papel não autorizado", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: { user: { id: "2", role: "GERENTE" } }, userId: 2 } as any)
    const res = await del("1")
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas administradores podem excluir" })
  })

  it("exclui a visita e limpa os eventos de timeline em transação", async () => {
    const res = await del("10")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificarDelecao).toHaveBeenCalledWith("Visita CRM", "10", "Tiago")
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("10")
    expect(res.status).toBe(500)
  })
})

describe("PUT /api/crm/visitas/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(geocodificarEndereco).mockReset()
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    vi.mocked(geocodificarEndereco).mockResolvedValue(null)
  })

  function put(id: string, body: Record<string, any>) {
    return PUT(new NextRequest(`http://localhost/api/crm/visitas/${id}`, { method: "PUT", body: JSON.stringify(body) }), {
      params: Promise.resolve({ id }),
    })
  }

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await put("10", {})
    expect(res.status).toBe(401)
  })

  it("geocodifica e salva as coordenadas ao atualizar o endereço da visita", async () => {
    vi.mocked(geocodificarEndereco).mockResolvedValue({ latitude: -16.82, longitude: -49.25 })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([visitaExistente()]))
    const builder = createQueryBuilder([visitaExistente({ enderecoLat: -16.82, enderecoLng: -49.25 })])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(builder)

    const res = await put("10", { endereco: "Av. X", numero: "100", bairro: "Centro", cidade: "Goiânia", uf: "GO" })

    expect(res.status).toBe(200)
    expect(geocodificarEndereco).toHaveBeenCalledWith("Av. X, 100, Centro, Goiânia, GO")
    const setArgs = builder.set.mock.calls[0][0]
    expect(setArgs.enderecoLat).toBe(-16.82)
    expect(setArgs.enderecoLng).toBe(-49.25)
    const body = await res.json()
    expect(body.enderecoLat).toBe(-16.82)
  })

  it("limpa as coordenadas ao remover o endereço da visita", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([visitaExistente()]))
    const builder = createQueryBuilder([visitaExistente()])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(builder)

    const res = await put("10", { endereco: null, numero: null, complemento: null, bairro: null, cidade: null, uf: null })

    expect(res.status).toBe(200)
    expect(geocodificarEndereco).not.toHaveBeenCalled()
    const setArgs = builder.set.mock.calls[0][0]
    expect(setArgs.enderecoLat).toBeNull()
    expect(setArgs.enderecoLng).toBeNull()
  })

  it("usa o endereço da pessoa (empresa) quando a visita fica sem endereço", async () => {
    vi.mocked(geocodificarEndereco).mockResolvedValue({ latitude: -16.68, longitude: -49.26 })
    ;(db.select as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(createQueryBuilder([visitaExistente({ empresaId: 9, endereco: null, numero: null, bairro: null, cidade: null, uf: null })]))
      .mockReturnValueOnce(
        createQueryBuilder([
          { endereco: "Av. das Empresas", numero: "500", complemento: null, bairro: "Industrial", cidade: "Aparecida de Goiânia", uf: "GO" },
        ])
      )
    const builder = createQueryBuilder([visitaExistente({ empresaId: 9 })])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(builder)

    const res = await put("10", { endereco: null })

    expect(res.status).toBe(200)
    expect(geocodificarEndereco).toHaveBeenCalledWith("Av. das Empresas, 500, Industrial, Aparecida de Goiânia, GO")
  })

  it("não geocodifica quando nenhum campo de endereço é enviado", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([visitaExistente()]))
    const builder = createQueryBuilder([visitaExistente()])
    ;(db.update as ReturnType<typeof vi.fn>).mockReturnValue(builder)

    const res = await put("10", { relato: "relato sem mudança de endereço" })

    expect(res.status).toBe(200)
    expect(geocodificarEndereco).not.toHaveBeenCalled()
    const setArgs = builder.set.mock.calls[0][0]
    expect(setArgs.enderecoLat).toBeUndefined()
  })
})
