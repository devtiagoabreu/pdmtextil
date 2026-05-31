import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { URL } from "node:url"

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]

function isPrivateIP(hostname: string): boolean {
  const parts = hostname.split(".")
  if (parts.length !== 4) return false
  const nums = parts.map(Number)
  if (nums.some(isNaN)) return false
  if (nums[0] === 10) return true
  if (nums[0] === 127) return true
  if (nums[0] === 192 && nums[1] === 168) return true
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true
  return false
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const raw = req.nextUrl.searchParams.get("url")
    if (!raw) {
      return NextResponse.json({ error: "url é obrigatório" }, { status: 400 })
    }

    const decoded = decodeURIComponent(raw)
    let parsed: URL
    try {
      parsed = new URL(decoded)
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 })
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Protocolo não permitido" }, { status: 400 })
    }

    const hostname = parsed.hostname.toLowerCase()
    if (BLOCKED_HOSTS.includes(hostname) || isPrivateIP(hostname)) {
      return NextResponse.json({ error: "URL não permitida" }, { status: 400 })
    }

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
