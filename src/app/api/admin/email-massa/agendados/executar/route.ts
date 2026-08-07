import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailAgendados } from "@/lib/db/schema/email-agendados"
import { and, eq, lte } from "drizzle-orm"
import { criarDisparo } from "@/lib/email-massa"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const session = await getServerSession(authOptions).catch(() => null)
    const isAdmin =
      session && (session.user.role === "ADMIN" || session.user.role === "SUDO" || session.user.role === "CRM")
    if (!(cronSecret && authHeader === `Bearer ${cronSecret}`) && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()
    const pendentes = await db
      .select()
      .from(emailAgendados)
      .where(and(eq(emailAgendados.status, "agendado"), lte(emailAgendados.agendadoPara, now)))

    if (pendentes.length === 0) {
      return NextResponse.json({ executados: 0, message: "Nenhum agendamento pendente" })
    }

    let executados = 0
    const erros: string[] = []

    for (const agendado of pendentes) {
      try {
        const result = await criarDisparo({
          nome: agendado.nome,
          para: agendado.para,
          listas: agendado.listas as number[] || undefined,
          assunto: agendado.assunto,
          html: agendado.html,
          preheader: agendado.preheader || "",
          modoEnvio: agendado.modoEnvio || "bcc",
          remetente: agendado.remetente || "sistema",
          criadoPor: agendado.criadoPor || undefined,
        })

        if (!result) {
          await db
            .update(emailAgendados)
            .set({ status: "erro", erro: "Nenhum destinatário encontrado", enviadoEm: now })
            .where(eq(emailAgendados.id, agendado.id))
          erros.push(`#${agendado.id}: Nenhum destinatário encontrado`)
          continue
        }

        await db
          .update(emailAgendados)
          .set({ status: "enviado", enviadoEm: now, erro: null })
          .where(eq(emailAgendados.id, agendado.id))
        executados++
      } catch (err: any) {
        await db
          .update(emailAgendados)
          .set({ status: "erro", erro: err.message || "Erro desconhecido", enviadoEm: now })
          .where(eq(emailAgendados.id, agendado.id))
        erros.push(`#${agendado.id}: ${err.message}`)
      }
    }

    return NextResponse.json({ executados, erros: erros.slice(0, 10) })
  } catch (error) {
    console.error("[POST /api/admin/email-massa/agendados/executar]", error)
    return NextResponse.json({ error: "Erro ao executar agendamentos" }, { status: 500 })
  }
}
