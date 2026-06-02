import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cloneDatabase } from "@/lib/db-admin"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { sourceConnString, targetConnString, sourceDb, targetDb } = await req.json()
    if (!sourceConnString || !targetConnString || !sourceDb || !targetDb) {
      return NextResponse.json({ error: "sourceConnString, targetConnString, sourceDb e targetDb são obrigatórios" }, { status: 400 })
    }

    const result = await cloneDatabase(sourceConnString, targetConnString, sourceDb, targetDb)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/clonar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
