import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById, sheetNoPeriodo, listClientesByGrupo, getRepsByGrupo } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string; grupo: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId, grupo } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const de = req.nextUrl.searchParams.get("de")
  const ate = req.nextUrl.searchParams.get("ate")
  const codigo = decodeURIComponent(grupo)
  const filtrada = sheetNoPeriodo(sheet, de, ate)
  const clientes = listClientesByGrupo(filtrada, codigo)
  const representantes = getRepsByGrupo(filtrada, codigo)

  return NextResponse.json({ grupo: codigo, clientes, representantes })
}
