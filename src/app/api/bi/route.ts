import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { loadSheet, getSheetById, sheetNoPeriodo } from "@/lib/bi/sheet-loader"
import { getMetrics, getRevenueByRepresentante, getMonthlyTrend, getGeoDistribution, getAbcCurve } from "@/lib/bi/sheet-loader"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const { url, force } = await req.json()
    if (!url) return NextResponse.json({ error: "URL da planilha é obrigatória" }, { status: 400 })

    const sheet = await loadSheet(url, { force: !!force })
    return NextResponse.json({
      id: sheet.id,
      title: sheet.title,
      tabs: sheet.tabs.map(t => ({ name: t.name, columns: t.header.length, rows: t.rows.length })),
      relationships: sheet.relationships,
      loadedAt: sheet.loadedAt,
    })
  } catch (error: any) {
    console.error("[BI] Error loading sheet:", error)
    return NextResponse.json({ error: error.message || "Erro ao carregar planilha" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const sheetId = req.nextUrl.searchParams.get("sheetId")
  if (!sheetId) return NextResponse.json({ error: "sheetId é obrigatório" }, { status: 400 })

  const sheet = await getSheetById(sheetId)
  if (!sheet) return NextResponse.json({ error: "Planilha não encontrada. Carregue-a primeiro." }, { status: 404 })

  const de = req.nextUrl.searchParams.get("de")
  const ate = req.nextUrl.searchParams.get("ate")
  const filtrada = sheetNoPeriodo(sheet, de, ate)

  const metrics = getMetrics(filtrada)
  const revenueByRep = getRevenueByRepresentante(filtrada)
  const monthlyTrend = getMonthlyTrend(filtrada)
  const geoDistribution = getGeoDistribution(filtrada)
  const abcCurve = getAbcCurve(filtrada)
  const relationships = sheet.relationships

  return NextResponse.json({
    id: sheet.id,
    title: sheet.title,
    tabs: sheet.tabs.map(t => ({ name: t.name, header: t.header, rows: t.rows.length })),
    metrics,
    revenueByRep,
    monthlyTrend,
    geoDistribution,
    abcCurve,
    relationships,
  })
}
