import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsAppLinhas } from "@/lib/db/schema/crm-whatsapp-linhas"
import { crmWhatsAppCatalogos } from "@/lib/db/schema/crm-whatsapp-catalogos"
import { eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const linhas = await db
      .select()
      .from(crmWhatsAppLinhas)
      .orderBy(crmWhatsAppLinhas.numero)

    return NextResponse.json(linhas)
  } catch (error) {
    console.error("[GET /api/admin/whatsapp-linhas]", error)
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
    const { numero, nome } = body

    if (!numero || !nome) {
      return NextResponse.json({ error: "Campos obrigatórios: numero, nome" }, { status: 400 })
    }

    const [novo] = await db
      .insert(crmWhatsAppLinhas)
      .values({ numero, nome })
      .returning()

    return NextResponse.json(novo)
  } catch (error: any) {
    console.error("[POST /api/admin/whatsapp-linhas]", error)
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Já existe uma linha com esse número" }, { status: 409 })
    }
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
      .update(crmWhatsAppLinhas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmWhatsAppLinhas.id, id))
      .returning()

    if (!atualizado) {
      return NextResponse.json({ error: "Linha não encontrada" }, { status: 404 })
    }

    return NextResponse.json(atualizado)
  } catch (error: any) {
    console.error("[PUT /api/admin/whatsapp-linhas]", error)
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Já existe uma linha com esse número" }, { status: 409 })
    }
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

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmWhatsAppCatalogos)
      .where(eq(crmWhatsAppCatalogos.linhaNumero, sql`(SELECT numero FROM crm_whatsapp_linhas WHERE id = ${Number(id)})`))

    if (count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${count} catalogo(s) vinculado(s) a esta linha` },
        { status: 409 }
      )
    }

    await db.delete(crmWhatsAppLinhas).where(eq(crmWhatsAppLinhas.id, Number(id)))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/whatsapp-linhas]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
