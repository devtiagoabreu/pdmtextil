import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db.select().from(integracoes).orderBy(integracoes.nome)
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/integracoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { nome, baseUrl, tipoAuth, authConfig, telas, mapping, ativo } = await req.json()
    if (!nome || !baseUrl) {
      return NextResponse.json({ error: "nome e baseUrl são obrigatórios" }, { status: 400 })
    }

    const [item] = await db.insert(integracoes).values({
      nome,
      baseUrl,
      tipoAuth: tipoAuth || "bearer",
      authConfig: authConfig || {},
      telas: telas || [],
      mapping: mapping || {},
      ativo: ativo !== undefined ? ativo : true,
    }).returning()

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/integracoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, nome, baseUrl, tipoAuth, authConfig, telas, mapping, ativo } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (nome !== undefined) updateData.nome = nome
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl
    if (tipoAuth !== undefined) updateData.tipoAuth = tipoAuth
    if (authConfig !== undefined) updateData.authConfig = authConfig
    if (telas !== undefined) updateData.telas = telas
    if (mapping !== undefined) updateData.mapping = mapping
    if (ativo !== undefined) updateData.ativo = ativo

    await db.update(integracoes).set(updateData).where(eq(integracoes.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/integracoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    await db.delete(integracoes).where(eq(integracoes.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/integracoes]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
