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
vi.mock("@/lib/crm/geocode", () => ({ geocodificarCamposEndereco: vi.fn() }))

import { geocodificarCamposEndereco } from "@/lib/crm/geocode"

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
    cep: null,
    enderecoLat: null,
    enderecoLng: null,
    clienteEndereco: null,
    clienteCidade: null,
    clienteUf: null,
    empresaEndereco: null,
    empresaNumero: null,
    empresaComplemento: null,
    empresaBairro: null,
    empresaCidade: null,
    empresaUf: null,
    empresaCep: null,
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
    vi.mocked(geocodificarCamposEndereco).mockReset()
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue(null)
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

  it("geocodifica o endereço da própria visita quando não há coordenadas de check-in", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -23.5, longitude: -46.63 })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(31, { checkInLat: null, checkInLng: null, checkOutLat: null, checkOutLng: null }),
        visitaRow(32, { checkInLat: null, checkInLng: null, checkOutLat: null, checkOutLng: null }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()

    expect(geocodificarCamposEndereco).toHaveBeenCalledWith({ endereco: "Av. X", numero: "100", complemento: null, bairro: "Centro", cidade: "Goiânia", uf: "GO" })
    expect(body.visitas[0]).toMatchObject({
      id: 31,
      latitude: -23.5,
      longitude: -46.63,
      localizacaoFonte: "geocodificada",
      km: 0,
    })
    expect(body.visitas[1].localizacaoFonte).toBe("geocodificada")
    expect(body.resumo).toMatchObject({ comLocalizacao: 2, geocodificadas: 2, kmSemLocalizacao: 0 })
    expect(body.resumo.kmTotal).toBe(0)
  })

  it("usa o endereço da pessoa (empresa) quando a visita não tem endereço", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -16.82, longitude: -49.25 })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(41, {
          endereco: null,
          numero: null,
          complemento: null,
          bairro: null,
          cidade: null,
          uf: null,
          cep: null,
          empresaEndereco: "Av. das Empresas",
          empresaNumero: "500",
          empresaComplemento: null,
          empresaBairro: "Industrial",
          empresaCidade: "Aparecida de Goiânia",
          empresaUf: "GO",
          empresaCep: null,
        }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()

    expect(geocodificarCamposEndereco).toHaveBeenCalledWith({ endereco: "Av. das Empresas", numero: "500", complemento: null, bairro: "Industrial", cidade: "Aparecida de Goiânia", uf: "GO" })
    expect(body.visitas[0].localizacaoFonte).toBe("geocodificada")
  })

  it("usa o endereço do cliente quando visita e pessoa não têm endereço", async () => {
    vi.mocked(geocodificarCamposEndereco).mockResolvedValue({ latitude: -16.33, longitude: -48.95 })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(51, {
          endereco: null,
          numero: null,
          complemento: null,
          bairro: null,
          cidade: null,
          uf: null,
          cep: null,
          empresaEndereco: null,
          empresaCidade: null,
          empresaUf: null,
          clienteEndereco: "Rua do Cliente, 90",
          clienteCidade: "Anápolis",
          clienteUf: "GO",
        }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()

    expect(geocodificarCamposEndereco).toHaveBeenCalledWith({ endereco: "Rua do Cliente, 90", cidade: "Anápolis", uf: "GO" })
    expect(body.visitas[0]).toMatchObject({ id: 51, latitude: -16.33, longitude: -48.95, localizacaoFonte: "geocodificada" })
  })

  it("usa as coordenadas de endereço persistidas sem chamar o Nominatim", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(71, { enderecoLat: -23.55, enderecoLng: -46.63 }),
        visitaRow(72, { enderecoLat: -22.90, enderecoLng: -43.17 }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()

    expect(geocodificarCamposEndereco).not.toHaveBeenCalled()
    expect(body.visitas[0]).toMatchObject({ id: 71, latitude: -23.55, longitude: -46.63, localizacaoFonte: "endereco", km: 0 })
    expect(body.visitas[1]).toMatchObject({ id: 72, latitude: -22.9, longitude: -43.17, localizacaoFonte: "endereco" })
    expect(body.resumo).toMatchObject({ comLocalizacao: 2, comEndereco: 2, geocodificadas: 0, kmSemLocalizacao: 0 })
    expect(body.resumo.kmTotal).toBeCloseTo(body.visitas[1].km, 0)
  })

  it("não chama geocodificação quando nenhuma origem tem endereço", async () => {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder([viagem]))
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      createQueryBuilder([
        visitaRow(61, {
          endereco: null,
          numero: null,
          complemento: null,
          bairro: null,
          cidade: null,
          uf: null,
          cep: null,
          empresaEndereco: null,
          empresaCidade: null,
          empresaUf: null,
          clienteEndereco: null,
          clienteCidade: null,
          clienteUf: null,
        }),
      ])
    )

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard/viagem?viagemId=7"))
    const body = await res.json()

    expect(geocodificarCamposEndereco).not.toHaveBeenCalled()
    expect(body.visitas[0]).toMatchObject({ latitude: null, longitude: null, localizacaoFonte: null, km: null })
    expect(body.resumo).toMatchObject({ comLocalizacao: 0, geocodificadas: 0, kmSemLocalizacao: 1 })
  })
})