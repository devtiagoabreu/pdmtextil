import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos } from "@/lib/db/schema/email-disparos"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function POST(
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

    await db
      .update(emailDisparos)
      .set({ status: "fila", erro: null, concluidoEm: null })
      .where(eq(emailDisparos.id, disparoId))

    return NextResponse.json({ success: true, status: "fila" })
  } catch (error: any) {
    console.error("[REENFILEIRAR]", error)
    return NextResponse.json({ error: "Erro ao reenfileirar" }, { status: 500 })
  }
}
