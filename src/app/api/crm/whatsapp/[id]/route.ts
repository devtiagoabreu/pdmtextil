import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { id } = await params

    const [atualizado] = await db
      .update(crmWhatsappMensagens)
      .set(body)
      .where(eq(crmWhatsappMensagens.id, Number(id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PATCH /api/crm/whatsapp/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
