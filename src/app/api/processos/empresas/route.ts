import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procEmpresas } from "@/lib/db/schema/processos"
import { desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procEmpresaSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select()
      .from(procEmpresas)
      .orderBy(desc(procEmpresas.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/empresas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procEmpresaSchema, body)
    if ("error" in parsed) return parsed.error

    const [nova] = await db
      .insert(procEmpresas)
      .values({
        nome: parsed.data.nome,
        cnpj: parsed.data.cnpj || null,
        segmento: parsed.data.segmento || null,
        observacoes: parsed.data.observacoes || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Empresa criada: ${nova.nome}`,
      entidade: "ProcEmpresa",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_EMPRESA_CRIADA", `Empresa cadastrada: ${nova.nome}`, `/processos/empresas/${nova.id}`, session.user.name)

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/empresas")
  }
}