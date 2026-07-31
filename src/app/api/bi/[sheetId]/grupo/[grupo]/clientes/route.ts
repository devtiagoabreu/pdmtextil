import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById, listClientesByGrupo } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string; grupo: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId, grupo } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const codigo = decodeURIComponent(grupo)
  const clientes = listClientesByGrupo(sheet, codigo)

  return NextResponse.json({ grupo: codigo, clientes })
}
