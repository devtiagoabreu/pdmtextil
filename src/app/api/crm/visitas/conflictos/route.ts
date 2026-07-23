import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const dataVisita = searchParams.get("dataVisita")
    const hora = searchParams.get("hora")
    const excludeId = searchParams.get("excludeId")

    if (!dataVisita || !hora) {
      return NextResponse.json({ conflictos: [] })
    }

    const conditions = [
      eq(crmVisitas.dataVisita, dataVisita),
      eq(crmVisitas.hora, hora),
      eq(crmVisitas.status, "AGENDADA"),
    ]

    if (excludeId) {
      const { ne } = await import("drizzle-orm")
      conditions.push(ne(crmVisitas.id, parseInt(excludeId)))
    }

    const conflictos = await db
      .select({
        id: crmVisitas.id,
        dataVisita: crmVisitas.dataVisita,
        hora: crmVisitas.hora,
        tipo: crmVisitas.tipo,
        empresaNome: crmPessoas.razaoSocial,
        clienteNome: clientes.nome,
      })
      .from(crmVisitas)
      .leftJoin(crmPessoas, eq(crmVisitas.empresaId, crmPessoas.id))
      .leftJoin(clientes, eq(crmVisitas.clienteId, clientes.id))
      .where(and(...conditions))

    return NextResponse.json({ conflictos })
  } catch (error) {
    console.error("[GET /api/crm/visitas/conflictos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
