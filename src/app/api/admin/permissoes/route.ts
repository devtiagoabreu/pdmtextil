import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { roles } from "@/lib/db/schema/roles"
import { eq } from "drizzle-orm"

const MODULOS = ["SOLICITACOES", "PRODUTO_CRU", "CADASTROS", "AMOSTRAS", "USUARIOS", "CONFIGURACOES"]
const PERMISSOES = ["VIEW", "INSERT", "UPDATE", "DELETE"]

export type PermissoesMap = Record<string, string[]>

function permissoesPadrao(): PermissoesMap {
  const map: PermissoesMap = {}
  for (const modulo of MODULOS) {
    map[modulo] = [...PERMISSOES]
  }
  return map
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select().from(roles).where(eq(roles.ativo, true)).orderBy(roles.label)

    const data = lista.map(r => ({
      id: r.id,
      name: r.name,
      label: r.label,
      permissoes: (r.permissions as PermissoesMap) || permissoesPadrao(),
    }))

    return NextResponse.json({ modulos: MODULOS, permissoes: PERMISSOES, roles: data })
  } catch (error) {
    console.error("[GET /api/admin/permissoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { roleName, permissoes } = body

    if (!roleName || !permissoes) {
      return NextResponse.json({ error: "roleName e permissoes são obrigatórios" }, { status: 400 })
    }

    await db
      .update(roles)
      .set({ permissions: permissoes, updatedAt: new Date() })
      .where(eq(roles.name, roleName))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/permissoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
