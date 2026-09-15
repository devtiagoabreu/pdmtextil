import { db } from "@/lib/db"
import {
  ativosPlanosVistoria,
  ativosVistorias,
  ativosTiposVistoria,
} from "@/lib/db/schema/ativos"
import { eq, and, gte, lte } from "drizzle-orm"

const PERIODICIDADE_DIAS: Record<string, number> = {
  DIARIA: 1,
  SEMANAL: 7,
  MENSAL: 30,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  ANUAL: 365,
  BIENAL: 730,
  TRIENAL: 1095,
  QUINQUENAL: 1825,
}

export function diasDaPeriodicidade(
  periodicidade: string,
  overrideDias?: number | null,
): number {
  if (overrideDias && overrideDias > 0) return overrideDias
  return PERIODICIDADE_DIAS[periodicidade] ?? 30
}

function adicionarDias(data: Date, dias: number): Date {
  const r = new Date(data)
  r.setDate(r.getDate() + dias)
  return r
}

function paraDateLocal(v: string | Date): Date {
  if (v instanceof Date) return v
  const [y, m, d] = v.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function paraIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dia}`
}

export async function gerarOcorrencias(
  planoId: number,
  opts: {
    proximaData: string | Date
    periodicidade: string
    diasIntervalo?: number | null
    ativoId: number
    tipoVistoriaId: number
    responsavelId?: number | null
    ativo?: boolean
  },
  tx = db,
) {
  const dias = diasDaPeriodicidade(opts.periodicidade, opts.diasIntervalo)
  const base = paraDateLocal(opts.proximaData)
  const fimJanela = adicionarDias(base, 365)

  const existentes = await tx
    .select({ dataProgramada: ativosVistorias.dataProgramada })
    .from(ativosVistorias)
    .where(
      and(
        eq(ativosVistorias.planoId, planoId),
        gte(ativosVistorias.dataProgramada, paraIsoDate(base)),
        lte(ativosVistorias.dataProgramada, paraIsoDate(fimJanela)),
      ),
    )

  const datasExistentes = new Set(existentes.map((r: { dataProgramada: string }) => r.dataProgramada))

  let atual = new Date(base)
  const novas: typeof ativosVistorias.$inferInsert[] = []

  while (atual <= fimJanela) {
    const iso = paraIsoDate(atual)
    if (!datasExistentes.has(iso)) {
      novas.push({
        planoId,
        ativoId: opts.ativoId,
        tipoVistoriaId: opts.tipoVistoriaId,
        status: "PENDENTE",
        dataProgramada: iso,
      })
    }
    atual = adicionarDias(atual, dias)
  }

  if (novas.length > 0) {
    await tx.insert(ativosVistorias).values(novas)
  }

  return novas.length
}

export async function avancarPlano(
  planoId: number,
  dataRealizada: string | Date,
  tx = db,
) {
  const plano = await tx
    .select()
    .from(ativosPlanosVistoria)
    .where(eq(ativosPlanosVistoria.id, planoId))
    .limit(1)

  if (plano.length === 0) return

  const p = plano[0]
  const tipo = await tx
    .select()
    .from(ativosTiposVistoria)
    .where(eq(ativosTiposVistoria.id, p.tipoVistoriaId))
    .limit(1)

  if (tipo.length === 0) return

  const dias = diasDaPeriodicidade(
    tipo[0].periodicidade,
    p.diasIntervalo ?? tipo[0].diasIntervalo,
  )
  const novaData = adicionarDias(paraDateLocal(dataRealizada), dias)

  await tx
    .update(ativosPlanosVistoria)
    .set({ proximaData: paraIsoDate(novaData) })
    .where(eq(ativosPlanosVistoria.id, planoId))

  const existente = await tx
    .select({ id: ativosVistorias.id })
    .from(ativosVistorias)
    .where(
      and(
        eq(ativosVistorias.planoId, planoId),
        eq(ativosVistorias.dataProgramada, paraIsoDate(novaData)),
      ),
    )
    .limit(1)

  if (existente.length === 0) {
    await tx.insert(ativosVistorias).values({
      planoId,
      ativoId: p.ativoId,
      tipoVistoriaId: p.tipoVistoriaId,
      status: "PENDENTE",
      dataProgramada: paraIsoDate(novaData),
    })
  }
}
