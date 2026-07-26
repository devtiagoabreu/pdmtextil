import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsAppCatalogos } from "@/lib/db/schema/crm-whatsapp-catalogos"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const catalogos = await db
      .select()
      .from(crmWhatsAppCatalogos)
      .orderBy(crmWhatsAppCatalogos.linhaNumero, crmWhatsAppCatalogos.titulo)

    return NextResponse.json(catalogos)
  } catch (error) {
    console.error("[GET /api/admin/whatsapp-catalogos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { linhaNumero, linhaNome, titulo, linkUrl, descricao } = body

    if (!linhaNumero || !linhaNome || !titulo || !linkUrl) {
      return NextResponse.json({ error: "Campos obrigatórios: linhaNumero, linhaNome, titulo, linkUrl" }, { status: 400 })
    }

    const [novo] = await db
      .insert(crmWhatsAppCatalogos)
      .values({ linhaNumero, linhaNome, titulo, linkUrl, descricao: descricao || null })
      .returning()

    return NextResponse.json(novo)
  } catch (error) {
    console.error("[POST /api/admin/whatsapp-catalogos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const [atualizado] = await db
      .update(crmWhatsAppCatalogos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmWhatsAppCatalogos.id, id))
      .returning()

    if (!atualizado) {
      return NextResponse.json({ error: "Catalogo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/admin/whatsapp-catalogos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = req.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    await db.delete(crmWhatsAppCatalogos).where(eq(crmWhatsAppCatalogos.id, Number(id)))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/whatsapp-catalogos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
