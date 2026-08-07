import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailAgendados } from "@/lib/db/schema/email-agendados"
import { eq } from "drizzle-orm"
import { criarDisparo } from "@/lib/email-massa"

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
    const agendadoId = Number(id)
    if (!agendadoId) return NextResponse.json({ error: "Agendamento inválido" }, { status: 400 })

    const [agendado] = await db.select().from(emailAgendados).where(eq(emailAgendados.id, agendadoId))
    if (!agendado) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    if (agendado.status === "enviado") return NextResponse.json({ error: "Este disparo já foi enviado" }, { status: 400 })
    if (agendado.status === "cancelado") return NextResponse.json({ error: "Este disparo foi cancelado" }, { status: 400 })

    const result = await criarDisparo({
      nome: agendado.nome,
      para: agendado.para,
      listas: agendado.listas as number[] | undefined,
      assunto: agendado.assunto,
      html: agendado.html,
      preheader: agendado.preheader || "",
      modoEnvio: agendado.modoEnvio || "bcc",
      remetente: agendado.remetente || "sistema",
      criadoPor: agendado.criadoPor || undefined,
    })

    if (!result) return NextResponse.json({ error: "Nenhum destinatário encontrado" }, { status: 400 })

    await db
      .update(emailAgendados)
      .set({ status: "enviado", enviadoEm: new Date(), erro: null })
      .where(eq(emailAgendados.id, agendadoId))

    return NextResponse.json({ disparoId: result.id, total: result.total })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa/agendados/[id]/enviar]", error)
    return NextResponse.json({ error: "Erro ao enviar agendamento" }, { status: 500 })
  }
}
