import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procSites, procEmpresas } from "@/lib/db/schema/processos"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procSiteSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: procSites.id,
        empresaId: procSites.empresaId,
        empresaNome: procEmpresas.nome,
        nome: procSites.nome,
        cidade: procSites.cidade,
        uf: procSites.uf,
        ativo: procSites.ativo,
        createdAt: procSites.createdAt,
        updatedAt: procSites.updatedAt,
      })
      .from(procSites)
      .leftJoin(procEmpresas, eq(procSites.empresaId, procEmpresas.id))
      .orderBy(desc(procSites.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/sites]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procSiteSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(procSites)
      .values({
        empresaId: parsed.data.empresaId,
        nome: parsed.data.nome,
        cidade: parsed.data.cidade || null,
        uf: parsed.data.uf || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Site criado: ${nova.nome}`,
      entidade: "ProcSite",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_SITE_CRIADO", `Site cadastrado: ${nova.nome}`, `/processos/sites/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/sites")
  }
}