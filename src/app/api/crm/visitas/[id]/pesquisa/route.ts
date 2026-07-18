import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPesquisasSatisfacao } from "@/lib/db/schema/crm-pesquisas-satisfacao"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq } from "drizzle-orm"
import { sendCrmEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const visitaId = Number(id)
    if (isNaN(visitaId)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 })
    }

    const body = await request.json()
    const { email, nome } = body

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    const [visita] = await db
      .select()
      .from(crmVisitas)
      .where(eq(crmVisitas.id, visitaId))
      .limit(1)

    if (!visita) {
      return NextResponse.json({ error: "Visita nao encontrada" }, { status: 404 })
    }

    const token = crypto.randomBytes(32).toString("hex")

    const [pesquisa] = await db
      .insert(crmPesquisasSatisfacao)
      .values({
        visitaId,
        email,
        nome: nome || null,
        token,
        enviadoEm: new Date(),
        status: "ENVIADO",
        criadoPor: auth.userId,
      })
      .returning()

    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/comercial/crm/pesquisa/${token}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #073fb8; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Pesquisa de Satisfacao</h1>
          <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">PDM PRO TEXTIL</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 14px; color: #334155; margin: 0 0 15px;">
            Olá ${nome || "visitante"},
          </p>
          <p style="font-size: 14px; color: #334155; margin: 0 0 15px;">
            Agradecemos pela visita realizada em ${visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "data recente"}.
          </p>
          <p style="font-size: 14px; color: #334155; margin: 0 0 20px;">
            Sua opiniao e muito importante para nos! Por favor, responda nossa pesquisa de satisfacao.
          </p>
          <a href="${surveyUrl}" style="display: inline-block; background: #073fb8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
            Responder Pesquisa
          </a>
          <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0;">
            Se o botao nao funcionar, copie e cole o link no navegador:<br/>
            <a href="${surveyUrl}" style="color: #073fb8;">${surveyUrl}</a>
          </p>
        </div>
      </div>
    `

    const result = await sendCrmEmail({
      to: email,
      subject: "Pesquisa de Satisfacao - PDM PRO TEXTIL",
      html,
    })

    if (result.error) {
      console.error("[Survey Email]", result.error)
    }

    return NextResponse.json(pesquisa, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/visitas/[id]/pesquisa]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
