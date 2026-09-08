import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procProcessos, procAreas, procSites } from "@/lib/db/schema/processos"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { procProcessoSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: procProcessos.id,
        areaId: procProcessos.areaId,
        areaNome: procAreas.nome,
        siteNome: procSites.nome,
        codigo: procProcessos.codigo,
        nome: procProcessos.nome,
        objetivo: procProcessos.objetivo,
        responsavel: procProcessos.responsavel,
        status: procProcessos.status,
        versao: procProcessos.versao,
        ativo: procProcessos.ativo,
        createdAt: procProcessos.createdAt,
        updatedAt: procProcessos.updatedAt,
      })
      .from(procProcessos)
      .leftJoin(procAreas, eq(procProcessos.areaId, procAreas.id))
      .leftJoin(procSites, eq(procAreas.siteId, procSites.id))
      .orderBy(desc(procProcessos.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/processos/processos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(procProcessoSchema, body)
    if ("error" in parsed) return parsed.error

    const [novo] = await db
      .insert(procProcessos)
      .values({
        areaId: parsed.data.areaId,
        codigo: parsed.data.codigo || null,
        nome: parsed.data.nome,
        objetivo: parsed.data.objetivo || null,
        responsavel: parsed.data.responsavel || null,
        status: parsed.data.status ?? "RASCUNHO",
        versao: parsed.data.versao ?? 0,
        entradas: parsed.data.entradas ?? [],
        saidas: parsed.data.saidas ?? [],
        fornecedores: parsed.data.fornecedores ?? [],
        clientes: parsed.data.clientes ?? [],
        recursos: parsed.data.recursos ?? [],
        sistemas: parsed.data.sistemas ?? [],
        equipamentos: parsed.data.equipamentos ?? [],
        indicadores: parsed.data.indicadores ?? [],
        riscos: parsed.data.riscos ?? [],
        controles: parsed.data.controles ?? [],
        observacoes: parsed.data.observacoes || null,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Processo criado: ${novo.nome}`,
      entidade: "ProcProcesso",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    await notificar("PROC_PROCESSO_CRIADO", `Processo cadastrado: ${novo.nome}`, `/processos/processos/${novo.id}`, session.user.name)

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/processos/processos")
  }
}