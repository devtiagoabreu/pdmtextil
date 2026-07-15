import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificacaoRegras } from "@/lib/db/schema/notificacao-regras"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

const TIPOS_NOTIFICACAO = [
  "SOLICITACAO_CRIADA",
  "SOLICITACAO_APROVADA",
  "SOLICITACAO_REPROVADA",
  "SOLICITACAO_ATUALIZADA",
  "PRODUTO_CRU_CRIADO",
  "PRODUTO_CRU_ATUALIZADO",
  "PRODUTO_CRU_EXCLUIDO",
  "AMOSTRA_CRIADA",
  "AMOSTRA_APROVADA",
  "AMOSTRA_REPROVADA",
  "AMOSTRA_ATUALIZADA",
  "AMOSTRA_EXCLUIDA",
  "ACABAMENTO_CRIADO",
  "ACABAMENTO_EXCLUIDO",
  "REQUISICAO_CORTE",
  "REQUISICAO_CORTE_STATUS",
  "LEAD_CRIADO",
  "LEAD_ATUALIZADO",
  "OPORTUNIDADE_CRIADA",
  "OPORTUNIDADE_ATUALIZADA",
  "OPORTUNIDADE_STATUS",
  "PESSOA_CRIADA",
  "PESSOA_ATUALIZADA",
  "CONTATO_CRIADO",
  "CONTATO_ATUALIZADO",
  "TAREFA_CRIADA",
  "TAREFA_ATUALIZADA",
  "VISITA_CRIADA",
  "VISITA_ATUALIZADA",
  "PROPOSTA_CRIADA",
  "PROPOSTA_ATUALIZADA",
  "CAMPANHA_CRIADA",
  "CAMPANHA_ATUALIZADA",
  "EQUIPE_CRIADA",
  "EQUIPE_ATUALIZADA",
  "REGIAO_CRIADA",
  "REGIAO_ATUALIZADA",
] as const

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const regras = await db.select().from(notificacaoRegras).orderBy(notificacaoRegras.tipo)

    // Monta mapa: tipo -> roles[]
    const mapa = new Map<string, string[]>()
    for (const r of regras) {
      const roles = Array.isArray(r.roles) ? r.roles.map(String) : []
      mapa.set(r.tipo, roles)
    }

    // Retorna todos os tipos, preenchendo com [] os que não têm regra
    const data = TIPOS_NOTIFICACAO.map(tipo => ({
      tipo,
      roles: mapa.get(tipo) ?? [],
    }))

    return NextResponse.json({ tipos: TIPOS_NOTIFICACAO, regras: data })
  } catch (error) {
    console.error("[GET /api/admin/notificacao-regras]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { tipo, roles } = body

    if (!tipo || !Array.isArray(roles)) {
      return NextResponse.json({ error: "tipo e roles (array) são obrigatórios" }, { status: 400 })
    }

    if (!TIPOS_NOTIFICACAO.includes(tipo)) {
      return NextResponse.json({ error: `Tipo de notificação inválido: ${tipo}` }, { status: 400 })
    }

    // Upsert: se já existe regra para este tipo, atualiza; senão cria
    const existente = await db
      .select({ id: notificacaoRegras.id })
      .from(notificacaoRegras)
      .where(eq(notificacaoRegras.tipo, tipo))
      .limit(1)

    if (existente.length > 0) {
      await db
        .update(notificacaoRegras)
        .set({ roles, updatedAt: new Date() })
        .where(eq(notificacaoRegras.id, existente[0].id))
    } else {
      await db.insert(notificacaoRegras).values({ tipo, roles })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/notificacao-regras]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
