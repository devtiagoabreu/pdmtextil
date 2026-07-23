import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { eq, inArray, and } from "drizzle-orm"
import { notificar } from "@/lib/notificar"

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { ids, status } = body

    if (!ids?.length || !status) {
      return NextResponse.json({ error: "ids e status sao obrigatorios" }, { status: 400 })
    }

    const allowed = ["AGENDADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"]
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Status invalido" }, { status: 400 })
    }

    const userId = auth.userId
    const role = auth.session.user.role
    const isAdminOrSudo = role === "ADMIN" || role === "SUDO"

    if (!isAdminOrSudo) {
      const [visita] = await db.select({ criadoPor: crmVisitas.criadoPor }).from(crmVisitas).where(eq(crmVisitas.id, ids[0])).limit(1)
      if (!visita || visita.criadoPor !== userId) {
        return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
      }
    }

    await db.update(crmVisitas).set({ status }).where(inArray(crmVisitas.id, ids))

    return NextResponse.json({ updated: ids.length })
  } catch (error) {
    console.error("[PATCH /api/crm/visitas/bulk]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { ids } = body

    if (!ids?.length) {
      return NextResponse.json({ error: "ids e obrigatorios" }, { status: 400 })
    }

    const userId = auth.userId
    const role = auth.session.user.role
    const isAdminOrSudo = role === "ADMIN" || role === "SUDO"
    const canDelete = isAdminOrSudo || ["COMERCIAL", "CRM"].includes(role)

    if (!canDelete) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
    }

    if (!isAdminOrSudo) {
      const visitas = await db.select({ id: crmVisitas.id, criadoPor: crmVisitas.criadoPor }).from(crmVisitas).where(inArray(crmVisitas.id, ids))
      const unauthorized = visitas.filter(v => v.criadoPor !== userId)
      if (unauthorized.length > 0) {
        return NextResponse.json({ error: `${unauthorized.length} visita(s) sem permissao para excluir` }, { status: 403 })
      }
    }

    await db.delete(crmVisitas).where(inArray(crmVisitas.id, ids))

    await notificar("VISITA_CRIADA", `${ids.length} visita(s) excluida(s) em lote`, `/comercial/crm/visitas`, auth.session.user.name)

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error("[DELETE /api/crm/visitas/bulk]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
