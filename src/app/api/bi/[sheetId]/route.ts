import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById } from "@/lib/bi/sheet-loader"
import { getMetrics, getRevenueByRepresentante, getMonthlyTrend, getGeoDistribution, getAbcCurve, listProdutos } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const metrics = getMetrics(sheet)
  const revenueByRep = getRevenueByRepresentante(sheet)
  const monthlyTrend = getMonthlyTrend(sheet)
  const geoDistribution = getGeoDistribution(sheet)
  const abcCurve = getAbcCurve(sheet)
  const produtos = listProdutos(sheet)

  return NextResponse.json({
    id: sheet.id,
    title: sheet.title,
    tabs: sheet.tabs.map(t => ({ name: t.name, header: t.header, rows: t.rows.length })),
    produtos,
    metrics,
    revenueByRep,
    monthlyTrend,
    geoDistribution,
    abcCurve,
    relationships: sheet.relationships,
  })
}
