import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById, listClientesByProduto } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string; codigo: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId, codigo } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const clientes = listClientesByProduto(sheet, decodeURIComponent(codigo))

  return NextResponse.json({ produto: decodeURIComponent(codigo), clientes })
}
