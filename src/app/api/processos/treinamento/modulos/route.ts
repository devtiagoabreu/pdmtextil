import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { procTreinoModulos } from "@/lib/db/schema/proc-treino-modulos"
import { asc } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const modulos = await db
      .select()
      .from(procTreinoModulos)
      .orderBy(asc(procTreinoModulos.ordem))

    return NextResponse.json(modulos)
  } catch (error) {
    console.error("[GET /api/processos/treinamento/modulos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { titulo, descricao, icone, cor, ordem } = body

    if (!titulo) {
      return NextResponse.json({ error: "titulo é obrigatório" }, { status: 400 })
    }

    const [novo] = await db
      .insert(procTreinoModulos)
      .values({
        titulo,
        descricao: descricao || null,
        icone: icone || "GraduationCap",
        cor: cor || "#0ea5e9",
        ordem: ordem || 0,
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Módulo de treinamento criado: ${titulo}`,
      entidade: "ProcTreinoModulo",
      entidadeId: novo.id,
      usuarioNome: auth.session.user.name,
    })

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("[POST /api/processos/treinamento/modulos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}