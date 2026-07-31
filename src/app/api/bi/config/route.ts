import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTtlMinutos, setTtlMinutos } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  return NextResponse.json({ ttlMinutos: await getTtlMinutos() })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUDO"
  if (!isAdmin) return NextResponse.json({ error: "Permissão negada" }, { status: 403 })

  try {
    const { ttlMinutos } = await req.json()
    if (typeof ttlMinutos !== "number" || !Number.isFinite(ttlMinutos)) {
      return NextResponse.json({ error: "ttlMinutos inválido" }, { status: 400 })
    }

    await setTtlMinutos(ttlMinutos)
    return NextResponse.json({ ttlMinutos: await getTtlMinutos() })
  } catch (error: any) {
    console.error("[BI] Error updating config:", error)
    return NextResponse.json({ error: error.message || "Erro ao atualizar configuração" }, { status: 500 })
  }
}
