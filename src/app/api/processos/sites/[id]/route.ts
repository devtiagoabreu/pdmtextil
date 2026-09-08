import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procSites } from "@/lib/db/schema/processos"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procSiteSchema } from "@/lib/validation"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [registro] = await db
      .select()
      .from(procSites)
      .where(eq(procSites.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Site não encontrado" }, { status: 404 })
    }

    return NextResponse.json(registro)
  } catch (error) {
    console.error("[GET /api/processos/sites/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(procSiteSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(procSites)
      .where(eq(procSites.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Site não encontrado" }, { status: 404 })
    }

    const [atualizado] = await db
      .update(procSites)
      .set({
        empresaId: parsed.data.empresaId,
        nome: parsed.data.nome,
        cidade: parsed.data.cidade || null,
        uf: parsed.data.uf || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : existente.ativo,
        updatedAt: new Date(),
      })
      .where(eq(procSites.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Site #${id} atualizado`,
      entidade: "ProcSite",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/processos/sites/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    const [existente] = await db
      .select()
      .from(procSites)
      .where(eq(procSites.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Site não encontrado" }, { status: 404 })
    }

    await db.delete(procSites).where(eq(procSites.id, parseInt(id)))

    await notificarDelecao("Site", existente.nome, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/processos/sites/[id]")
  }
}