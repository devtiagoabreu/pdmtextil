import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmViagens } from "@/lib/db/schema/crm-viagens"
import { crmViagensInvestimentos } from "@/lib/db/schema/crm-viagens-investimentos"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, asc, desc, sql } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const viagemId = parseInt(id)

    const [viagem] = await db
      .select({
        id: crmViagens.id,
        titulo: crmViagens.titulo,
        descricao: crmViagens.descricao,
        destinoCidade: crmViagens.destinoCidade,
        destinoUf: crmViagens.destinoUf,
        dataInicio: crmViagens.dataInicio,
        dataFim: crmViagens.dataFim,
        status: crmViagens.status,
        criadoPor: crmViagens.criadoPor,
        criadoPorNome: usuarios.name,
        totalInvestimento: sql`COALESCE((SELECT COALESCE(SUM(i.valor), 0) FROM crm_viagens_investimentos i WHERE i.viagem_id = ${crmViagens.id}), 0)`,
        createdAt: crmViagens.createdAt,
        updatedAt: crmViagens.updatedAt,
      })
      .from(crmViagens)
      .leftJoin(usuarios, eq(crmViagens.criadoPor, usuarios.id))
      .where(eq(crmViagens.id, viagemId))
      .limit(1)

    if (!viagem) {
      return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 })
    }

    const investimentos = await db
      .select()
      .from(crmViagensInvestimentos)
      .where(eq(crmViagensInvestimentos.viagemId, viagemId))
      .orderBy(asc(crmViagensInvestimentos.id))

    const visitas = await db
      .select({
        id: crmVisitas.id,
        dataVisita: crmVisitas.dataVisita,
        hora: crmVisitas.hora,
        tipo: crmVisitas.tipo,
        status: crmVisitas.status,
        empresaId: crmVisitas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        clienteId: crmVisitas.clienteId,
        clienteNome: clientes.nome,
        nomeAvulso: crmVisitas.nomeAvulso,
        relato: crmVisitas.relato,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .where(eq(crmVisitas.viagemId, viagemId))
      .orderBy(asc(crmVisitas.dataVisita))

    return NextResponse.json({ ...viagem, investimentos, visitas })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/viagens/[id]")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const viagemId = parseInt(id)
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmViagens)
      .where(eq(crmViagens.id, viagemId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 })
    }

    const userRole = auth.session.user?.role ?? ""
    if (userRole !== "ADMIN" && userRole !== "SUDO" && existente.criadoPor !== auth.userId) {
      return NextResponse.json({ error: "Apenas o criador da viagem pode editá-la" }, { status: 403 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.titulo !== undefined) {
      if (!body.titulo?.trim()) {
        return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
      }
      values.titulo = body.titulo.trim()
    }
    if (body.descricao !== undefined) values.descricao = body.descricao?.trim() || null
    if (body.destinoCidade !== undefined) values.destinoCidade = body.destinoCidade?.trim() || null
    if (body.destinoUf !== undefined) values.destinoUf = body.destinoUf?.trim() || null
    if (body.dataInicio !== undefined) values.dataInicio = body.dataInicio || null
    if (body.dataFim !== undefined) values.dataFim = body.dataFim || null
    if (body.status !== undefined) values.status = body.status

    const investimentos = Array.isArray(body.investimentos)
      ? body.investimentos
          .filter((i: any) => i?.tipo)
          .map((i: any) => ({
            tipo: i.tipo.trim(),
            valor: i.valor != null && i.valor !== "" ? i.valor : null,
            observacao: i.observacao?.trim() || null,
          }))
      : null

    const [atualizada] = await db.transaction(async (tx: any) => {
      const [updated] = await tx
        .update(crmViagens)
        .set(values)
        .where(eq(crmViagens.id, viagemId))
        .returning()

      if (investimentos) {
        await tx.delete(crmViagensInvestimentos).where(eq(crmViagensInvestimentos.viagemId, viagemId))
        if (investimentos.length > 0) {
          await tx.insert(crmViagensInvestimentos).values(
            investimentos.map((inv: any) => ({ ...inv, viagemId }))
          )
        }
      }

      return [updated]
    })

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Viagem "${atualizada.titulo}" (#${viagemId}) atualizada${investimentos ? ` — ${investimentos.length} investimento(s)` : ""}`,
      entidade: "CrmViagem",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    await notificar("VIAGEM_ATUALIZADA", `Viagem "${atualizada.titulo}" atualizada`, `/comercial/crm/viagens/${atualizada.id}`, session.user.name)

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/viagens/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userRole = auth.session.user?.role ?? ""

    const { id } = await params
    const viagemId = parseInt(id)

    const [existente] = await db
      .select()
      .from(crmViagens)
      .where(eq(crmViagens.id, viagemId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Viagem não encontrada" }, { status: 404 })
    }

    if (userRole !== "ADMIN" && userRole !== "SUDO" && existente.criadoPor !== auth.userId) {
      return NextResponse.json({ error: "Apenas o criador da viagem pode excluí-la" }, { status: 403 })
    }

    await db.transaction(async (tx: any) => {
      await tx
        .update(crmVisitas)
        .set({ viagemId: null })
        .where(eq(crmVisitas.viagemId, viagemId))
      await tx.delete(crmViagens).where(eq(crmViagens.id, viagemId))
    })

    await registrarLog({
      tipo: "EXCLUSAO",
      acao: "excluir",
      descricao: `Viagem "${existente.titulo}" (#${viagemId}) excluída`,
      entidade: "CrmViagem",
      entidadeId: viagemId,
      usuarioNome: session.user.name,
    })
    await notificarDelecao("Viagem CRM", id, session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/viagens/[id]")
  }
}
