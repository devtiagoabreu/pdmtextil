import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { setupRedundancy } from "@/lib/db-admin"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { primaryConnString, standbyConnString, publicationName, subscriptionName, primaryDb, standbyDb } = await req.json()
    if (!primaryConnString || !standbyConnString || !primaryDb || !standbyDb) {
      return NextResponse.json({ error: "primaryConnString, standbyConnString, primaryDb e standbyDb são obrigatórios" }, { status: 400 })
    }

    const pubName = publicationName || `pub_${primaryDb}_${Date.now()}`
    const subName = subscriptionName || `sub_${standbyDb}_${Date.now()}`

    const result = await setupRedundancy(primaryConnString, standbyConnString, pubName, subName, primaryDb, standbyDb)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/config/banco-dados/redundancia]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
