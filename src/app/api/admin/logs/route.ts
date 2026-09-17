import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logs } from "@/lib/db/schema/logs"
import { and, desc, eq, like, or, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export interface QueryLogs {
  itens: (typeof logs.$inferSelect)[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1)
    const limite = Math.min(100, Math.max(1, Number(searchParams.get("limite")) || 20))
    const tipo = searchParams.get("tipo") || ""
    const busca = (searchParams.get("busca") || "").trim()

    const condicoes = []
    if (tipo) condicoes.push(eq(logs.tipo, tipo))
    if (busca) {
      const termo = `%${busca}%`
      condicoes.push(
        or(
          like(logs.acao, termo),
          like(logs.descricao, termo),
          like(logs.entidade, termo),
          like(logs.entidadeId, termo),
          like(logs.usuarioNome, termo)
        )!
      )
    }

    const where = condicoes.length > 0 ? and(...condicoes) : undefined

    const [totalResult] = await db
      .select({ total: sql<number>`count(*)` })
      .from(logs)
      .where(where)

    const total = Number(totalResult?.total ?? 0)
    const totalPaginas = Math.max(1, Math.ceil(total / limite))
    const offset = (pagina - 1) * limite

    const itens = await db
      .select()
      .from(logs)
      .where(where)
      .orderBy(desc(logs.createdAt), desc(logs.id))
      .limit(limite)
      .offset(offset)

    const result: QueryLogs = { itens, total, pagina, limite, totalPaginas }
    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/admin/logs]", error)
    return NextResponse.json({ error: "Erro ao buscar logs de auditoria" }, { status: 500 })
  }
}
