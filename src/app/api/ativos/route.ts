import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativos, ativoCategorias } from "@/lib/db/schema/ativos"
import { maquinas } from "@/lib/db/schema/maqoper"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const lista = await db
      .select({
        id: ativos.id,
        codigo: ativos.codigo,
        nome: ativos.nome,
        categoriaId: ativos.categoriaId,
        categoriaNome: ativoCategorias.nome,
        localizacao: ativos.localizacao,
        fabricante: ativos.fabricante,
        modelo: ativos.modelo,
        numSerie: ativos.numSerie,
        anoFabricacao: ativos.anoFabricacao,
        status: ativos.status,
        maquinaId: ativos.maquinaId,
        maquinaNome: maquinas.nome,
        responsavelId: ativos.responsavelId,
        responsavelNome: usuarios.name,
        ativo: ativos.ativo,
        createdAt: ativos.createdAt,
        updatedAt: ativos.updatedAt,
      })
      .from(ativos)
      .leftJoin(ativoCategorias, eq(ativos.categoriaId, ativoCategorias.id))
      .leftJoin(maquinas, eq(ativos.maquinaId, maquinas.id))
      .leftJoin(usuarios, eq(ativos.responsavelId, usuarios.id))
      .orderBy(desc(ativos.id))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/ativos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(ativoSchema, body)
    if ("error" in parsed) return parsed.error

    const [novo] = await db
      .insert(ativos)
      .values({
        codigo: parsed.data.codigo,
        nome: parsed.data.nome,
        categoriaId: parsed.data.categoriaId,
        localizacao: parsed.data.localizacao || null,
        fabricante: parsed.data.fabricante || null,
        modelo: parsed.data.modelo || null,
        numSerie: parsed.data.numSerie || null,
        anoFabricacao: parsed.data.anoFabricacao || null,
        dataAquisicao: parsed.data.dataAquisicao || null,
        valorAquisicao: parsed.data.valorAquisicao || null,
        valorResidual: parsed.data.valorResidual || null,
        vidaUtilAnos: parsed.data.vidaUtilAnos || null,
        status: parsed.data.status || "ATIVO",
        maquinaId: parsed.data.maquinaId || null,
        responsavelId: parsed.data.responsavelId || null,
        observacoes: parsed.data.observacoes || null,
        anexos: parsed.data.anexos,
        ativo: parsed.data.ativo !== undefined ? parsed.data.ativo : true,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Ativo criado: ${novo.codigo}`,
      entidade: "Ativo",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "ATIVO_CRIADO",
      `Ativo cadastrado: ${novo.nome}`,
      `/ativos/ativos/`,
      session.user.name
    )

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/ativos")
  }
}
