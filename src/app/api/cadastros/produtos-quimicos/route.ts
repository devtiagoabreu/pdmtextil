import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosQuimicos } from "@/lib/db/schema/produtos-quimicos"
import { or, ilike } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    let lista
    if (search) {
      lista = await db.select().from(produtosQuimicos).where(
        or(ilike(produtosQuimicos.nome, `%${search}%`), ilike(produtosQuimicos.codigo, `%${search}%`))
      ).orderBy(produtosQuimicos.nome)
    } else {
      lista = await db.select().from(produtosQuimicos).orderBy(produtosQuimicos.nome)
    }
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/produtos-quimicos]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    if (!body.codigo || !body.nome) {
      return NextResponse.json({ error: "Código e nome são obrigatórios" }, { status: 400 })
    }

    const [novo] = await db.insert(produtosQuimicos).values({
      codigo: body.codigo,
      nome: body.nome,
      descricao: body.descricao || null,
      categoria: body.categoria || null,
      unidadePadrao: body.unidadePadrao || "kg",
      tipo: body.tipo || null,
      concentracao: body.concentracao || null,
      densidade: body.densidade || null,
      ph: body.ph || null,
      observacoes: body.observacoes || null,
      fichaSeguranca: body.fichaSeguranca || null,
      idIntegracao: body.idIntegracao || null,
      ativo: body.ativo ?? true,
      criadoPor: parseInt(session.user.id),
    }).returning()

    return NextResponse.json(novo[0])
  } catch (error: any) {
    if (error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Código já existe" }, { status: 400 })
    }
    console.error("[POST /api/cadastros/produtos-quimicos]", error)
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 })
  }
}
