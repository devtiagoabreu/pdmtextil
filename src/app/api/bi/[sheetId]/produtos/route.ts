import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCachedSheet, listProdutos } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId } = await params
  const sheet = getCachedSheet(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const search = req.nextUrl.searchParams.get("q") || ""
  let produtos = listProdutos(sheet)

  if (search) {
    produtos = produtos.filter(p => p.toLowerCase().includes(search.toLowerCase()))
  }

  return NextResponse.json({ produtos: produtos.slice(0, 500) })
}
