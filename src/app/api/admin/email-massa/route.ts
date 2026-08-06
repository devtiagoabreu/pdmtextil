import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { criarDisparo } from "@/lib/email-massa"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { para, assunto, html, listas, modo_envio, remetente, preheader, nome } = body

    if (!para || !assunto || !html) {
      return NextResponse.json({ error: "Para, assunto e conteúdo são obrigatórios" }, { status: 400 })
    }

    if (para === "lista" && (!listas || listas.length === 0)) {
      return NextResponse.json({ error: "Selecione pelo menos uma lista" }, { status: 400 })
    }

    const result = await criarDisparo({
      nome,
      para,
      listas,
      assunto,
      html,
      preheader,
      modoEnvio: modo_envio,
      remetente,
      criadoPor: Number(session.user.id) || undefined,
    })

    if (!result) {
      return NextResponse.json({ error: "Nenhum destinatário encontrado" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      disparoId: result.id,
      remessaId: result.remessaId,
      total: result.total,
      status: "fila",
    })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa]", error)
    return NextResponse.json({ error: "Erro ao criar disparo" }, { status: 500 })
  }
}
