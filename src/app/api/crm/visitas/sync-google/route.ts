import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar"

function buildEventSummary(visita: any): string {
  const entity = visita.empresaNome || visita.clienteNome || "Visita"
  return `Visita - ${entity}`
}

function buildEventDescription(visita: any): string {
  const parts: string[] = []
  if (visita.tipo) parts.push(`Tipo: ${visita.tipo}`)
  if (visita.endereco) parts.push(`Endereco: ${visita.endereco}${visita.numero ? `, ${visita.numero}` : ""}${visita.cidade ? ` - ${visita.cidade}/${visita.uf}` : ""}`)
  if (visita.relato) parts.push(`Relato: ${visita.relato.replace(/<[^>]*>/g, "").slice(0, 200)}`)
  return parts.join("\n")
}

function buildEventLocation(visita: any): string {
  if (!visita.endereco) return ""
  return `${visita.endereco}${visita.numero ? `, ${visita.numero}` : ""}${visita.cidade ? ` - ${visita.cidade}/${visita.uf}` : ""}`
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const accessToken = (session.user as any).accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "Login via Google necessario para sincronizar com Google Calendar" }, { status: 400 })
    }

    const body = await req.json()
    const { visitaId } = body

    const [visita] = await db
      .select({
        id: crmVisitas.id,
        empresaId: crmVisitas.empresaId,
        empresaNome: crmPessoas.razaoSocial,
        clienteId: crmVisitas.clienteId,
        clienteNome: clientes.nome,
        dataVisita: crmVisitas.dataVisita,
        hora: crmVisitas.hora,
        tipo: crmVisitas.tipo,
        endereco: crmVisitas.endereco,
        numero: crmVisitas.numero,
        cidade: crmVisitas.cidade,
        uf: crmVisitas.uf,
        relato: crmVisitas.relato,
        googleEventId: crmVisitas.googleEventId,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .where(eq(crmVisitas.id, visitaId))
      .limit(1)

    if (!visita) {
      return NextResponse.json({ error: "Visita nao encontrada" }, { status: 404 })
    }

    const startTime = `${visita.dataVisita}T${visita.hora || "09:00"}:00`
    const eventInput = {
      summary: buildEventSummary(visita),
      description: buildEventDescription(visita),
      startTime,
      location: buildEventLocation(visita),
    }

    let eventId: string

    if (visita.googleEventId) {
      await updateCalendarEvent(accessToken, visita.googleEventId, eventInput)
      eventId = visita.googleEventId
    } else {
      eventId = await createCalendarEvent(accessToken, eventInput)
    }

    await db
      .update(crmVisitas)
      .set({ googleEventId: eventId, updatedAt: new Date() })
      .where(eq(crmVisitas.id, visitaId))

    return NextResponse.json({ success: true, eventId })
  } catch (error: any) {
    console.error("[SYNC GOOGLE]", error.message)
    return NextResponse.json({ error: "Erro ao sincronizar com Google Calendar" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const accessToken = (session.user as any).accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "Login via Google necessario" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const visitaId = parseInt(searchParams.get("visitaId") || "0")

    const [visita] = await db
      .select({ googleEventId: crmVisitas.googleEventId })
      .from(crmVisitas)
      .where(eq(crmVisitas.id, visitaId))
      .limit(1)

    if (!visita?.googleEventId) {
      return NextResponse.json({ error: "Visita nao sincronizada" }, { status: 400 })
    }

    await deleteCalendarEvent(accessToken, visita.googleEventId)

    await db
      .update(crmVisitas)
      .set({ googleEventId: null, updatedAt: new Date() })
      .where(eq(crmVisitas.id, visitaId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[DESINCRONIZAR GOOGLE]", error.message)
    return NextResponse.json({ error: "Erro ao dessincronizar" }, { status: 500 })
  }
}
