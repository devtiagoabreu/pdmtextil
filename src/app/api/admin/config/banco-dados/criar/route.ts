import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createDatabase } from "@/lib/db-admin"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { connectionString, dbName } = await req.json()
    if (!connectionString || !dbName) {
      return NextResponse.json({ error: "connectionString e dbName são obrigatórios" }, { status: 400 })
    }

    const result = await createDatabase(connectionString, dbName)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/criar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
