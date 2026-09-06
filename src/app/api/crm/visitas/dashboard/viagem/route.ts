import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmViagens } from "@/lib/db/schema/crm-viagens"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { eq, asc } from "drizzle-orm"
import { calcularTrajeto, type PontoRota } from "@/lib/crm/roteiro-geo"
import { geocodificarEndereco } from "@/lib/crm/geocode"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const viagemId = Number(searchParams.get("viagemId"))
    if (!viagemId) {
      return NextResponse.json({ error: "viagemId é obrigatório" }, { status: 400 })
    }

    const [viagemResult, visitas] = await Promise.all([
      db.select().from(crmViagens).where(eq(crmViagens.id, viagemId)),
      db
        .select({
          id: crmVisitas.id,
          empresaId: crmVisitas.empresaId,
          empresaNome: crmPessoas.razaoSocial,
          clienteId: crmVisitas.clienteId,
          clienteNome: clientes.nome,
          clienteEndereco: clientes.endereco,
          clienteCidade: clientes.cidade,
          clienteUf: clientes.uf,
          nomeAvulso: crmVisitas.nomeAvulso,
          dataVisita: crmVisitas.dataVisita,
          hora: crmVisitas.hora,
          tipo: crmVisitas.tipo,
          status: crmVisitas.status,
          endereco: crmVisitas.endereco,
          numero: crmVisitas.numero,
          complemento: crmVisitas.complemento,
          bairro: crmVisitas.bairro,
          cidade: crmVisitas.cidade,
          uf: crmVisitas.uf,
          cep: crmVisitas.cep,
          enderecoLat: crmVisitas.enderecoLat,
          enderecoLng: crmVisitas.enderecoLng,
          empresaEndereco: crmPessoas.endereco,
          empresaNumero: crmPessoas.numero,
          empresaComplemento: crmPessoas.complemento,
          empresaBairro: crmPessoas.bairro,
          empresaCidade: crmPessoas.cidade,
          empresaUf: crmPessoas.uf,
          empresaCep: crmPessoas.cep,
          checkInTime: crmVisitas.checkInTime,
          checkOutTime: crmVisitas.checkOutTime,
          checkInLat: crmVisitas.checkInLat,
          checkInLng: crmVisitas.checkInLng,
          checkOutLat: crmVisitas.checkOutLat,
          checkOutLng: crmVisitas.checkOutLng,
        })
        .from(crmVisitas)
        .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
        .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
        .where(eq(crmVisitas.viagemId, viagemId))
        .orderBy(asc(crmVisitas.dataVisita), asc(crmVisitas.hora), asc(crmVisitas.id)),
    ])

    if (!viagemResult[0]) {
      return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 })
    }

    const viagem = viagemResult[0]

    const visitasOrdenadas = visitas.map((r: any) => {
      const montar = (base: Record<string, string | null>) =>
        [base.endereco, base.numero, base.complemento, base.bairro, base.cidade, base.uf]
          .filter(Boolean)
          .join(", ")
      const enderecoTexto = montar(r)
      const enderecoGeocode =
        montar({
          endereco: r.endereco,
          numero: r.numero,
          complemento: r.complemento,
          bairro: r.bairro,
          cidade: r.cidade,
          uf: r.uf,
        }) ||
        montar({
          endereco: r.empresaEndereco,
          numero: r.empresaNumero,
          complemento: r.empresaComplemento,
          bairro: r.empresaBairro,
          cidade: r.empresaCidade,
          uf: r.empresaUf,
        }) ||
        montar({
          endereco: r.clienteEndereco,
          cidade: r.clienteCidade,
          uf: r.clienteUf,
        })
      const nome = r.empresaNome || r.clienteNome || r.nomeAvulso || `Visita #${r.id}`
      return { ...r, nome, enderecoTexto, enderecoGeocode }
    })

    const geocodificadas = new Map<number, { latitude: number; longitude: number }>()
    for (const v of visitasOrdenadas) {
      const temCheckIn = v.checkInLat != null || v.checkInLng != null
      const temCheckOut = v.checkOutLat != null || v.checkOutLng != null
      const temEnderecoCoords = v.enderecoLat != null || v.enderecoLng != null
      if (temCheckIn || temCheckOut || temEnderecoCoords) continue
      if (!v.enderecoGeocode) continue
      const coords = await geocodificarEndereco(v.enderecoGeocode)
      if (coords) geocodificadas.set(v.id, coords)
    }

    const pontos: PontoRota[] = []
    for (const v of visitasOrdenadas) {
      const latitude = v.checkInLat ?? v.checkOutLat ?? v.enderecoLat ?? geocodificadas.get(v.id)?.latitude
      const longitude = v.checkInLng ?? v.checkOutLng ?? v.enderecoLng ?? geocodificadas.get(v.id)?.longitude
      if (latitude != null && longitude != null) {
        pontos.push({ id: v.id, latitude: Number(latitude), longitude: Number(longitude) })
      }
    }

    const { kmEntrePontos, totalKm } = calcularTrajeto(pontos)
    let pontoIndex = 0

    const visitasComKm = visitasOrdenadas.map((v: any) => {
      const geocoded = geocodificadas.get(v.id)
      const latitude = v.checkInLat ?? v.checkOutLat ?? v.enderecoLat ?? geocoded?.latitude ?? null
      const longitude = v.checkInLng ?? v.checkOutLng ?? v.enderecoLng ?? geocoded?.longitude ?? null
      const temPonto = latitude != null && longitude != null
      let localizacaoFonte: "checkin" | "endereco" | "geocodificada" | null = null
      if (v.checkInLat != null || v.checkInLng != null || v.checkOutLat != null || v.checkOutLng != null) {
        localizacaoFonte = "checkin"
      } else if (v.enderecoLat != null || v.enderecoLng != null) {
        localizacaoFonte = "endereco"
      } else if (geocoded) {
        localizacaoFonte = "geocodificada"
      }
      let km: number | null = null
      if (temPonto) {
        km = pontoIndex === 0 ? 0 : kmEntrePontos[pontoIndex - 1] ?? 0
        pontoIndex++
      }
      return {
        id: v.id,
        nome: v.nome,
        empresaId: v.empresaId,
        clienteId: v.clienteId,
        dataVisita: v.dataVisita,
        hora: v.hora,
        tipo: v.tipo,
        status: v.status,
        enderecoTexto: v.enderecoTexto,
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
        latitude: temPonto ? Number(latitude) : null,
        longitude: temPonto ? Number(longitude) : null,
        localizacaoFonte,
        km: km == null ? null : Number(km.toFixed(1)),
      }
    })

    const comEndereco = visitasComKm.filter((v: any) => v.localizacaoFonte === "endereco").length

    return NextResponse.json({
      viagem: {
        id: viagem.id,
        titulo: viagem.titulo,
        descricao: viagem.descricao,
        destinoCidade: viagem.destinoCidade,
        destinoUf: viagem.destinoUf,
        dataInicio: viagem.dataInicio,
        dataFim: viagem.dataFim,
        status: viagem.status,
      },
      visitas: visitasComKm,
      resumo: {
        total: visitasComKm.length,
        realizadas: visitasComKm.filter((v: any) => v.status === "REALIZADA").length,
        canceladas: visitasComKm.filter((v: any) => v.status === "CANCELADA").length,
        agendadas: visitasComKm.filter((v: any) => v.status === "AGENDADA").length,
        comLocalizacao: pontos.length,
        comEndereco,
        geocodificadas: geocodificadas.size,
        kmTotal: Number(totalKm.toFixed(1)),
        kmSemLocalizacao: visitasComKm.length - pontos.length,
      },
    })
  } catch (error) {
    console.error("[GET /api/crm/visitas/dashboard/viagem]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}