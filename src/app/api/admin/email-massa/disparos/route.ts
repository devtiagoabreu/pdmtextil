import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos, type EmailDisparo } from "@/lib/db/schema/email-disparos"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { desc, inArray, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const disparos = await db
      .select({
        id: emailDisparos.id,
        nome: emailDisparos.nome,
        para: emailDisparos.para,
        assunto: emailDisparos.assunto,
        modoEnvio: emailDisparos.modoEnvio,
        remetente: emailDisparos.remetente,
        remessaId: emailDisparos.remessaId,
        status: emailDisparos.status,
        total: emailDisparos.total,
        enviados: emailDisparos.enviados,
        falhas: emailDisparos.falhas,
        erro: emailDisparos.erro,
        criadoPor: emailDisparos.criadoPor,
        criadoEm: emailDisparos.criadoEm,
        iniciadoEm: emailDisparos.iniciadoEm,
        concluidoEm: emailDisparos.concluidoEm,
      })
      .from(emailDisparos)
      .orderBy(desc(emailDisparos.id))
      .limit(50)

    const ids = disparos.map((d: EmailDisparo) => d.id)
    const contadoresMap = new Map<number, { pendentes: number; enviados: number; falhas: number }>()
    if (ids.length > 0) {
      const rows = await db
        .select({
          disparoId: emailEnviados.disparoId,
          pendentes: sql<number>`count(*) filter (where ${emailEnviados.status} = 'pendente')`,
          enviados: sql<number>`count(*) filter (where ${emailEnviados.status} = 'enviado')`,
          falhas: sql<number>`count(*) filter (where ${emailEnviados.status} = 'falhou')`,
        })
        .from(emailEnviados)
        .where(inArray(emailEnviados.disparoId, ids))
        .groupBy(emailEnviados.disparoId)
      for (const r of rows) {
        contadoresMap.set(r.disparoId!, {
          pendentes: Number(r.pendentes),
          enviados: Number(r.enviados),
          falhas: Number(r.falhas),
        })
      }
    }

    return NextResponse.json({
      disparos: disparos.map((d: EmailDisparo) => ({
        ...d,
        ...(contadoresMap.get(d.id) || { pendentes: 0, enviados: 0, falhas: 0 }),
      })),
    })
  } catch (error: any) {
    console.error("[DISPAROS]", error)
    return NextResponse.json({ error: "Erro ao carregar disparos" }, { status: 500 })
  }
}
