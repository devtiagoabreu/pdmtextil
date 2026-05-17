import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { eq, and, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(req.url)
    const apenasNaoLidas = searchParams.get("naoLidas") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")

    const conditions = [eq(notificacoes.usuarioId, userId)]
    if (apenasNaoLidas) conditions.push(eq(notificacoes.lida, false))

    const lista = await db
      .select()
      .from(notificacoes)
      .where(and(...conditions))
      .orderBy(desc(notificacoes.createdAt))
      .limit(limit)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/notificacoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userId = parseInt(session.user.id)
    const body = await req.json()

    if (body.marcarTodas) {
      await db
        .update(notificacoes)
        .set({ lida: true, lidaEm: new Date() })
        .where(and(eq(notificacoes.usuarioId, userId), eq(notificacoes.lida, false)))
    } else if (body.id) {
      await db
        .update(notificacoes)
        .set({ lida: true, lidaEm: new Date() })
        .where(and(eq(notificacoes.id, body.id), eq(notificacoes.usuarioId, userId)))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/notificacoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
