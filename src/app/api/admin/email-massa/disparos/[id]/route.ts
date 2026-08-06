import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos } from "@/lib/db/schema/email-disparos"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { and, eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const disparoId = Number(id)
    if (!disparoId) return NextResponse.json({ error: "Disparo inválido" }, { status: 400 })

    const [disparo] = await db.select().from(emailDisparos).where(eq(emailDisparos.id, disparoId))
    if (!disparo) return NextResponse.json({ error: "Disparo não encontrado" }, { status: 404 })

    const [pendente] = await db
      .select({ total: sql<number>`count(*)` })
      .from(emailEnviados)
      .where(and(eq(emailEnviados.disparoId, disparoId), eq(emailEnviados.status, "pendente")))

    return NextResponse.json({ ...disparo, pendentes: Number(pendente?.total || 0) })
  } catch (error: any) {
    console.error("[DISPARO]", error)
    return NextResponse.json({ error: "Erro ao carregar disparo" }, { status: 500 })
  }
}
