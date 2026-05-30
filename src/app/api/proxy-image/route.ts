import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url")
    if (!url) {
      return NextResponse.json({ error: "url é obrigatório" }, { status: 400 })
    }
    const decoded = decodeURIComponent(url)
    const res = await fetch(decoded)
    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao buscar imagem" }, { status: 502 })
    }
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") || "image/png"
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("[PROXY-IMAGE]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
