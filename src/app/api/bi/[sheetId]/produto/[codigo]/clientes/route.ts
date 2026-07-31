import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById, sheetNoPeriodo, listClientesByProduto } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string; codigo: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId, codigo } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const de = req.nextUrl.searchParams.get("de")
  const ate = req.nextUrl.searchParams.get("ate")
  const clientes = listClientesByProduto(sheetNoPeriodo(sheet, de, ate), decodeURIComponent(codigo))

  return NextResponse.json({ produto: decodeURIComponent(codigo), clientes })
}
