import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const { status } = await req.json()

    const [existente] = await db
      .select()
      .from(crmOportunidades)
      .where(eq(crmOportunidades.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(crmOportunidades)
      .set({ status, updatedAt: new Date() })
      .where(eq(crmOportunidades.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "mover",
      descricao: `Oportunidade "${existente.titulo}" movida para ${status}`,
      entidade: "CrmOportunidade",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/crm/oportunidades/[id]/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
