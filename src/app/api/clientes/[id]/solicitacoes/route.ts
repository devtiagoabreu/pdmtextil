import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { anexos } from "@/lib/db/schema/anexos"
import { eq, desc, or, sql, and } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const cliente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, parseInt(id)))
      .limit(1)

    if (!cliente[0]) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const c = cliente[0]
    const lista = await db
      .select({
        id: solicitacoes.id,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        cliente: solicitacoes.cliente,
        cnpj: solicitacoes.cnpj,
        projeto: solicitacoes.projeto,
        prazoDesejado: solicitacoes.prazoDesejado,
        createdAt: solicitacoes.createdAt,
        solicitanteNome: usuarios.name,
      })
      .from(solicitacoes)
      .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
      .where(
        and(
          or(
            eq(solicitacoes.cliente, c.nome),
            eq(solicitacoes.cnpj, c.cnpj)
          )
        )
      )
      .orderBy(desc(solicitacoes.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/clientes/[id]/solicitacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
