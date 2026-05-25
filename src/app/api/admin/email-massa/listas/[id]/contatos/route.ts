import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailListaContatos } from "@/lib/db/schema/email-listas"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const listaId = Number(params.id)
    const contatos = await db.select().from(emailListaContatos).where(eq(emailListaContatos.listaId, listaId)).orderBy(emailListaContatos.nome)
    return NextResponse.json(contatos)
  } catch (error) {
    console.error("[GET /api/admin/email-massa/listas/contatos]", error)
    return NextResponse.json({ error: "Erro ao listar contatos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const listaId = Number(params.id)
    const body = await req.json()

    if (body.contatos && Array.isArray(body.contatos)) {
      const contatos = body.contatos.filter((c: any) => c.nome && c.email)
      if (contatos.length === 0) {
        return NextResponse.json({ error: "Nenhum contato válido" }, { status: 400 })
      }

      await db.delete(emailListaContatos).where(eq(emailListaContatos.listaId, listaId))
      const inseridos = await db.insert(emailListaContatos).values(
        contatos.map((c: { nome: string; email: string }) => ({
          listaId,
          nome: c.nome,
          email: c.email,
        }))
      ).returning()

      return NextResponse.json(inseridos)
    }

    const { nome, email } = body
    if (!nome || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 })
    }

    const [novo] = await db.insert(emailListaContatos).values({ listaId, nome, email }).returning()
    return NextResponse.json(novo)
  } catch (error) {
    console.error("[POST /api/admin/email-massa/listas/contatos]", error)
    return NextResponse.json({ error: "Erro ao salvar contatos" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const listaId = Number(params.id)
    const { searchParams } = new URL(req.url)
    const contatoId = searchParams.get("contatoId")

    if (contatoId) {
      await db.delete(emailListaContatos).where(
        eq(emailListaContatos.id, Number(contatoId))
      )
    } else {
      await db.delete(emailListaContatos).where(eq(emailListaContatos.listaId, listaId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/email-massa/listas/contatos]", error)
    return NextResponse.json({ error: "Erro ao deletar contato" }, { status: 500 })
  }
}
