import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sincronizarBounces } from "@/lib/email-bounces"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const usuarioId = Number(session.user.id)
    if (!usuarioId) return NextResponse.json({ error: "Usuário inválido" }, { status: 400 })

    const resultado = await sincronizarBounces(usuarioId)
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa/bounces/sincronizar]", error)
    return NextResponse.json({ error: "Erro ao sincronizar bounces" }, { status: 500 })
  }
}
