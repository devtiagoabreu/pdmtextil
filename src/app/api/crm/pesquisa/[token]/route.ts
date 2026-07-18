import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { crmPesquisasRespostas } from "@/lib/db/schema/crm-pesquisas-respostas"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const [pesquisa] = await db
      .select()
      .from(crmPesquisasSatisfacao)
      .where(eq(crmPesquisasSatisfacao.token, token))
      .limit(1)

    if (!pesquisa) {
      return NextResponse.json({ error: "Pesquisa nao encontrada" }, { status: 404 })
    }

    if (pesquisa.status === "RESPONDIDO") {
      return NextResponse.json({ ...pesquisa, alreadyAnswered: true })
    }

    if (pesquisa.status !== "ENVIADO" && pesquisa.status !== "ABERTO") {
      return NextResponse.json({ error: "Pesquisa invalida" }, { status: 400 })
    }

    if (pesquisa.status === "ENVIADO") {
      await db
        .update(crmPesquisasSatisfacao)
        .set({
          abertoEm: new Date(),
          status: "ABERTO",
        })
        .where(eq(crmPesquisasSatisfacao.id, pesquisa.id))
    }

    const [visita] = await db
      .select()
      .from(crmVisitas)
      .where(eq(crmVisitas.id, pesquisa.visitaId))
      .limit(1)

    return NextResponse.json({
      ...pesquisa,
      empresaNome: null,
      dataVisita: visita?.dataVisita || null,
    })
  } catch (error) {
    console.error("[GET /api/crm/pesquisa/[token]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { respostas } = body

    const [pesquisa] = await db
      .select()
      .from(crmPesquisasSatisfacao)
      .where(eq(crmPesquisasSatisfacao.token, token))
      .limit(1)

    if (!pesquisa) {
      return NextResponse.json({ error: "Pesquisa nao encontrada" }, { status: 404 })
    }

    if (pesquisa.status === "RESPONDIDO") {
      return NextResponse.json({ error: "Pesquisa ja respondida" }, { status: 400 })
    }

    if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
      return NextResponse.json({ error: "Respostas obrigatorias" }, { status: 400 })
    }

    for (const resposta of respostas) {
      if (!resposta.pergunta || !resposta.resposta) {
        return NextResponse.json({ error: "Todas as perguntas devem ser respondidas" }, { status: 400 })
      }
    }

    await db.insert(crmPesquisasRespostas).values(
      respostas.map((r: any) => ({
        pesquisaId: pesquisa.id,
        pergunta: r.pergunta,
        tipo: r.tipo || "ALTERNATIVA",
        resposta: r.resposta,
      }))
    )

    await db
      .update(crmPesquisasSatisfacao)
      .set({
        respondidoEm: new Date(),
        status: "RESPONDIDO",
      })
      .where(eq(crmPesquisasSatisfacao.id, pesquisa.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/crm/pesquisa/[token]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
