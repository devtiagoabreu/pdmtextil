import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { eq } from "drizzle-orm"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await req.json()
    const { tipo, latitude, longitude } = body

    if (tipo !== "check_in" && tipo !== "check_out") {
      return NextResponse.json({ error: "Tipo inválido (use check_in ou check_out)" }, { status: 400 })
    }

    const [visita] = await db
      .select()
      .from(crmVisitas)
      .where(eq(crmVisitas.id, parseInt(id)))
      .limit(1)

    if (!visita) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 })
    }

    const userRole = auth.session.user.role
    if (userRole !== "ADMIN" && userRole !== "SUDO" && visita.criadoPor !== auth.userId) {
      return NextResponse.json({ error: "Apenas o criador da visita pode registrar check-in/out" }, { status: 403 })
    }

    if (tipo === "check_in" && visita.checkInTime) {
      return NextResponse.json({ error: "Check-in já realizado" }, { status: 400 })
    }
    if (tipo === "check_out" && !visita.checkInTime) {
      return NextResponse.json({ error: "Faça check-in primeiro" }, { status: 400 })
    }
    if (tipo === "check_out" && visita.checkOutTime) {
      return NextResponse.json({ error: "Check-out já realizado" }, { status: 400 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (tipo === "check_in") {
      values.checkInTime = new Date()
      values.checkInLat = latitude ?? null
      values.checkInLng = longitude ?? null
    } else {
      values.checkOutTime = new Date()
      values.checkOutLat = latitude ?? null
      values.checkOutLng = longitude ?? null
      values.status = "REALIZADA"
    }

    const [atualizada] = await db
      .update(crmVisitas)
      .set(values)
      .where(eq(crmVisitas.id, parseInt(id)))
      .returning()

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error(`[POST /api/crm/visitas/[id]/check]`, error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
