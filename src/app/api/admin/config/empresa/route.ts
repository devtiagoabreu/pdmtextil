import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { configEmpresa, ConfigEmpresa } from "@/lib/db/schema/config-empresa"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const lista = await db.select().from(configEmpresa).orderBy(configEmpresa.nome)
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/config/empresa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const data = await req.json()
    if (!data.nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    const [item] = await db.insert(configEmpresa).values(data).returning()
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/config/empresa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const { id, ...data } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }
    await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx.update(configEmpresa).set({ isDefault: false })
      }
      data.updatedAt = new Date()
      await tx.update(configEmpresa).set(data).where(eq(configEmpresa.id, id))
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/config/empresa]", error)
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
    await db.delete(configEmpresa).where(eq(configEmpresa.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/config/empresa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
