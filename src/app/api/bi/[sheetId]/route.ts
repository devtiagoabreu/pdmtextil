import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSheetById, sheetNoPeriodo } from "@/lib/bi/sheet-loader"
import { getMetrics, getRevenueByRepresentante, getMonthlyTrend, getGeoDistribution, getAbcCurve, listProdutos, listGrupos, getRepResumo, getClientesResumo, getPrevisao } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ sheetId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { sheetId } = await params
  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada" }, { status: 404 })

  const de = req.nextUrl.searchParams.get("de")
  const ate = req.nextUrl.searchParams.get("ate")
  const filtrada = sheetNoPeriodo(sheet, de, ate)

  const metrics = getMetrics(filtrada)
  const revenueByRep = getRevenueByRepresentante(filtrada)
  const monthlyTrend = getMonthlyTrend(filtrada)
  const geoDistribution = getGeoDistribution(filtrada)
  const abcCurve = getAbcCurve(filtrada)
  const produtos = listProdutos(filtrada)
  const grupos = listGrupos(filtrada)
  const repResumo = getRepResumo(filtrada)
  const clientesResumo = getClientesResumo(sheet)
  const previsao = getPrevisao(filtrada)

  return NextResponse.json({
    id: sheet.id,
    title: sheet.title,
    periodo: { de: de || null, ate: ate || null },
    tabs: sheet.tabs.map(t => ({ name: t.name, header: t.header, rows: t.rows.length })),
    produtos,
    grupos,
    metrics,
    revenueByRep,
    monthlyTrend,
    geoDistribution,
    abcCurve,
    repResumo,
    clientesResumo,
    previsao,
    relationships: sheet.relationships,
  })
}
