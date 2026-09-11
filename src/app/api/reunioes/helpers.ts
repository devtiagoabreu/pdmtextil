import { db } from "@/lib/db"
import { asc, desc, eq, inArray } from "drizzle-orm"
import {
  reunioes,
  reunioesProjetos,
  reuniaoAtas,
  reuniaoPautas,
  reuniaoParticipantes,
  reuniaoEncaminhamentos,
  reuniaoLinks,
} from "@/lib/db/schema"
import type { ReuniaoFormData } from "@/lib/reunioes"

export type TxReunioes = {
  insert: (table: unknown) => any
  delete: (table: unknown) => any
  update: (table: unknown) => any
}

export type ReuniaoItemLista = {
  id: number
  titulo: string
  projetoId: number
  projetoNome: string | null
  data: Date
  local: string | null
  status: string
  videoUrl: string | null
  links: { id: number; rotulo: string; url: string; descricao: string | null; ordem: number }[]
  createdAt: Date | null
  updatedAt: Date | null
  _count: { pautas: number; participantes: number; encaminhamentos: number; links: number }
}

export async function listarReunioes(): Promise<ReuniaoItemLista[]> {
  const rows = await db.select().from(reunioes).orderBy(desc(reunioes.data))
  if (rows.length === 0) return []

  const ids = rows.map((r: any) => r.id)
  const [links, pautas, participantes, encaminhamentos] = await Promise.all([
    db.select().from(reuniaoLinks).where(inArray(reuniaoLinks.reuniaoId, ids)).orderBy(asc(reuniaoLinks.ordem)),
    db.select({ reuniaoId: reuniaoPautas.reuniaoId }).from(reuniaoPautas).where(inArray(reuniaoPautas.reuniaoId, ids)),
    db.select({ reuniaoId: reuniaoParticipantes.reuniaoId }).from(reuniaoParticipantes).where(inArray(reuniaoParticipantes.reuniaoId, ids)),
    db.select({ reuniaoId: reuniaoEncaminhamentos.reuniaoId }).from(reuniaoEncaminhamentos).where(inArray(reuniaoEncaminhamentos.reuniaoId, ids)),
  ])

  const projetoIds = [...new Set(rows.map((r: any) => r.projetoId))]
  const projetos = await db.select().from(reunioesProjetos).where(inArray(reunioesProjetos.id, projetoIds))
  const projetoMap = new Map(projetos.map((p) => [p.id, p.nome]))

  return rows.map((r: any) => ({
    ...r,
    projetoNome: projetoMap.get(r.projetoId) ?? null,
    links: links.filter((l: any) => l.reuniaoId === r.id),
    _count: {
      pautas: pautas.filter((p: any) => p.reuniaoId === r.id).length,
      participantes: participantes.filter((p: any) => p.reuniaoId === r.id).length,
      encaminhamentos: encaminhamentos.filter((e: any) => e.reuniaoId === r.id).length,
      links: links.filter((l: any) => l.reuniaoId === r.id).length,
    },
  }))
}

export async function listarProjetos() {
  return db.select().from(reunioesProjetos).orderBy(asc(reunioesProjetos.nome))
}

export async function buscarProjeto(id: number) {
  const rows = await db.select().from(reunioesProjetos).where(eq(reunioesProjetos.id, id)).limit(1)
  return rows[0] ?? null
}

export async function contarReunioesPorProjeto(id: number): Promise<number> {
  const rows = await db.select({ id: reunioes.id }).from(reunioes).where(eq(reunioes.projetoId, id))
  return rows.length
}

export async function carregarDetalheReuniao(id: number) {
  const reu = await db.select().from(reunioes).where(eq(reunioes.id, id)).limit(1)
  if (reu.length === 0) return null
  const r = reu[0]

  const projeto = await db.select().from(reunioesProjetos).where(eq(reunioesProjetos.id, r.projetoId)).limit(1)
  const projetoNome = projeto[0]?.nome ?? null

  const [ata, pautas, participantes, encaminhamentos, links] = await Promise.all([
    db.select().from(reuniaoAtas).where(eq(reuniaoAtas.reuniaoId, id)),
    db.select().from(reuniaoPautas).where(eq(reuniaoPautas.reuniaoId, id)).orderBy(asc(reuniaoPautas.ordem)),
    db.select().from(reuniaoParticipantes).where(eq(reuniaoParticipantes.reuniaoId, id)).orderBy(asc(reuniaoParticipantes.id)),
    db.select().from(reuniaoEncaminhamentos).where(eq(reuniaoEncaminhamentos.reuniaoId, id)).orderBy(asc(reuniaoEncaminhamentos.id)),
    db.select().from(reuniaoLinks).where(eq(reuniaoLinks.reuniaoId, id)).orderBy(asc(reuniaoLinks.ordem)),
  ])

  return {
    ...r,
    projetoNome,
    ata: ata[0] ? { conteudo: ata[0].conteudo, criadoPor: ata[0].criadoPor } : null,
    pautas,
    participantes,
    encaminhamentos,
    links,
  }
}

export async function inserirFilhos(
  tx: TxReunioes,
  reuniaoId: number,
  data: ReuniaoFormData,
  usuarioNome?: string | null
) {
  if (data.ata) {
    await tx.insert(reuniaoAtas).values({ reuniaoId, conteudo: data.ata, criadoPor: usuarioNome || null })
  }
  if (data.pautas.length > 0) {
    await tx.insert(reuniaoPautas).values(
      data.pautas.map((p, i) => ({ reuniaoId, ordem: i + 1, descricao: p.descricao }))
    )
  }
  if (data.participantes.length > 0) {
    await tx.insert(reuniaoParticipantes).values(
      data.participantes.map((p) => ({ reuniaoId, nome: p.nome, empresa: p.empresa, papel: p.papel }))
    )
  }
  if (data.encaminhamentos.length > 0) {
    await tx.insert(reuniaoEncaminhamentos).values(
      data.encaminhamentos.map((e) => ({
        reuniaoId,
        descricao: e.descricao,
        responsavel: e.responsavel,
        prazo: e.prazo,
        status: e.status,
      }))
    )
  }
  if (data.links.length > 0) {
    await tx.insert(reuniaoLinks).values(
      data.links.map((l, i) => ({ reuniaoId, rotulo: l.rotulo, url: l.url, descricao: l.descricao, ordem: i + 1 }))
    )
  }
}

export async function criarReuniaoComFilhos(
  tx: TxReunioes,
  data: ReuniaoFormData,
  usuarioNome?: string | null
) {
  const criada = await tx.insert(reunioes).values({
    titulo: data.titulo,
    projetoId: data.projetoId,
    data: data.data,
    local: data.local,
    status: data.status,
    resumoCurto: data.resumoCurto,
    resumoDetalhado: data.resumoDetalhado,
    resumoItensAcao: data.resumoItensAcao,
    transcricao: data.transcricao,
    videoUrl: data.videoUrl,
  }).returning()
  const reuniao = criada[0]
  await inserirFilhos(tx, reuniao.id, data, usuarioNome)
  return reuniao
}

export async function atualizarReuniaoComFilhos(
  tx: TxReunioes,
  id: number,
  data: ReuniaoFormData,
  usuarioNome?: string | null
) {
  const atualizada = await tx.update(reunioes).set({
    titulo: data.titulo,
    projetoId: data.projetoId,
    data: data.data,
    local: data.local,
    status: data.status,
    resumoCurto: data.resumoCurto,
    resumoDetalhado: data.resumoDetalhado,
    resumoItensAcao: data.resumoItensAcao,
    transcricao: data.transcricao,
    videoUrl: data.videoUrl,
    updatedAt: new Date(),
  }).where(eq(reunioes.id, id)).returning()

  if (atualizada.length === 0) return null

  await tx.delete(reuniaoAtas).where(eq(reuniaoAtas.reuniaoId, id))
  await tx.delete(reuniaoPautas).where(eq(reuniaoPautas.reuniaoId, id))
  await tx.delete(reuniaoParticipantes).where(eq(reuniaoParticipantes.reuniaoId, id))
  await tx.delete(reuniaoEncaminhamentos).where(eq(reuniaoEncaminhamentos.reuniaoId, id))
  await tx.delete(reuniaoLinks).where(eq(reuniaoLinks.reuniaoId, id))

  await inserirFilhos(tx, id, data, usuarioNome)
  return atualizada[0]
}