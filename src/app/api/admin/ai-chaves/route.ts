import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { aiChaves, type AiChave } from "@/lib/db/schema/ai-chaves"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

function mascarar(chave: string): string {
  if (!chave) return ""
  if (chave.length <= 8) return "********"
  return `${chave.slice(0, 4)}...${chave.slice(-4)}`
}

function precisaAdmin(session: any): boolean {
  return session && (session.user.role === "ADMIN" || session.user.role === "SUDO")
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const lista = await db.select().from(aiChaves).orderBy(aiChaves.ordem)
    return NextResponse.json(lista.map((c: AiChave) => ({ ...c, chaveApi: mascarar(c.chaveApi) })))
  } catch (error) {
    console.error("[GET /api/admin/ai-chaves]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!precisaAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { provedor, nome, chaveApi, urlBase, modelo, ordem, ativo } = await req.json()
    if (!nome || !chaveApi) {
      return NextResponse.json({ error: "nome e chaveApi são obrigatórios" }, { status: 400 })
    }

    const [item] = await db
      .insert(aiChaves)
      .values({
        provedor: provedor || "groq",
        nome,
        chaveApi,
        urlBase: urlBase || null,
        modelo: modelo || null,
        ordem: ordem || 1,
        ativo: ativo !== undefined ? ativo : true,
      })
      .returning()

    return NextResponse.json({ ...item, chaveApi: mascarar(item.chaveApi) }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/ai-chaves]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!precisaAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, provedor, nome, chaveApi, urlBase, modelo, ordem, ativo, failCount, ultimaFalha } = await req.json()
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (provedor !== undefined) updateData.provedor = provedor
    if (nome !== undefined) updateData.nome = nome
    if (chaveApi !== undefined && chaveApi.trim() !== "") updateData.chaveApi = chaveApi
    if (urlBase !== undefined) updateData.urlBase = urlBase || null
    if (modelo !== undefined) updateData.modelo = modelo || null
    if (ordem !== undefined) updateData.ordem = ordem
    if (ativo !== undefined) updateData.ativo = ativo
    if (failCount !== undefined) updateData.failCount = failCount
    if (ultimaFalha !== undefined) updateData.ultimaFalha = ultimaFalha

    await db.update(aiChaves).set(updateData).where(eq(aiChaves.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/ai-chaves]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!precisaAdmin(session)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })

    await db.delete(aiChaves).where(eq(aiChaves.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/ai-chaves]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
