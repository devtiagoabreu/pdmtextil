import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
export const dynamic = "force-dynamic"

export const TIPOS_STATUS = [
  { value: "SOLICITACAO_DESENVOLVIMENTO", label: "Solicitação de Desenvolvimento" },
  { value: "PRODUTO_CRU", label: "Produto Cru" },
  { value: "AMOSTRA", label: "Amostra" },
  { value: "REQUISICAO_CORTE", label: "Requisição de Corte" },
] as const

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const tipo = req.nextUrl.searchParams.get("tipo")
    const query = db.select().from(status).orderBy(asc(status.ordem), asc(status.nome))
    const lista = tipo
      ? await query.where(eq(status.tipo, tipo))
      : await query

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/status]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { nome, rotulo, tipo, cor, ordem, ativo } = await req.json()
    if (!nome || !tipo) {
      return NextResponse.json({ error: "nome e tipo são obrigatórios" }, { status: 400 })
    }

    const [item] = await db.insert(status).values({
      nome,
      rotulo: rotulo || nome,
      tipo,
      cor: cor || null,
      ordem: ordem ?? 0,
      ativo: ativo !== undefined ? ativo : true,
    }).returning()

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Já existe um status com este nome" }, { status: 409 })
    }
    console.error("[POST /api/admin/status]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id, nome, rotulo, tipo, cor, ordem, ativo } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    const [item] = await db.update(status).set({
      ...(nome !== undefined && { nome }),
      ...(rotulo !== undefined && { rotulo }),
      ...(tipo !== undefined && { tipo }),
      ...(cor !== undefined && { cor }),
      ...(ordem !== undefined && { ordem }),
      ...(ativo !== undefined && { ativo }),
      updatedAt: new Date(),
    }).where(eq(status.id, id)).returning()

    return NextResponse.json(item)
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Já existe um status com este nome" }, { status: 409 })
    }
    console.error("[PUT /api/admin/status]", error)
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

    await db.delete(status).where(eq(status.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/status]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
