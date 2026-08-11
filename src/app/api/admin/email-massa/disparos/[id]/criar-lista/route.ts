import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos } from "@/lib/db/schema/email-disparos"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { emailListas, emailListaContatos } from "@/lib/db/schema/email-listas"
import { and, eq, isNotNull } from "drizzle-orm"

export const dynamic = "force-dynamic"

const TIPOS = ["lidos", "clicados", "falhas"] as const
type Tipo = (typeof TIPOS)[number]

const ROTULOS: Record<Tipo, string> = {
  lidos: "abriram o e-mail",
  clicados: "clicaram em algum link",
  falhas: "falharam na entrega",
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const disparoId = Number(id)
    if (!disparoId) return NextResponse.json({ error: "Disparo inválido" }, { status: 400 })

    const [disparo] = await db.select().from(emailDisparos).where(eq(emailDisparos.id, disparoId))
    if (!disparo) return NextResponse.json({ error: "Disparo não encontrado" }, { status: 404 })

    const body = await req.json()
    const tipo: Tipo = body.tipo
    const nome = String(body.nome || "").trim()
    if (!TIPOS.includes(tipo)) return NextResponse.json({ error: "Tipo de lista inválido" }, { status: 400 })
    if (!nome) return NextResponse.json({ error: "Nome da lista é obrigatório" }, { status: 400 })

    let contatos: { nome: string | null; email: string }[]

    if (tipo === "lidos") {
      contatos = await db
        .select({ nome: emailEnviados.nome, email: emailEnviados.email })
        .from(emailEnviados)
        .where(and(eq(emailEnviados.disparoId, disparoId), isNotNull(emailEnviados.abertoEm)))
    } else if (tipo === "falhas") {
      contatos = await db
        .select({ nome: emailEnviados.nome, email: emailEnviados.email })
        .from(emailEnviados)
        .where(and(eq(emailEnviados.disparoId, disparoId), eq(emailEnviados.status, "falhou")))
    } else {
      contatos = await db
        .selectDistinct({ nome: emailEnviados.nome, email: emailEnviados.email })
        .from(emailEnviados)
        .innerJoin(emailCliques, eq(emailCliques.envioId, emailEnviados.id))
        .where(eq(emailEnviados.disparoId, disparoId))
    }

    const validos = contatos.filter((c) => c.email && c.email.includes("@"))
    if (validos.length === 0) {
      return NextResponse.json({ error: "Nenhum contato com esta característica neste disparo" }, { status: 400 })
    }

    const descricao = `Contatos do disparo #${disparoId} (${disparo.nome || disparo.assunto}) que ${ROTULOS[tipo]}. Gerado automaticamente em ${new Date().toLocaleString("pt-BR")}.`

    const [lista] = await db
      .insert(emailListas)
      .values({ nome, descricao })
      .returning({ id: emailListas.id, nome: emailListas.nome })

    const rows = validos.map((c) => ({
      listaId: lista.id,
      nome: c.nome || "Contato",
      email: c.email,
    }))
    for (let i = 0; i < rows.length; i += 1000) {
      await db.insert(emailListaContatos).values(rows.slice(i, i + 1000))
    }

    return NextResponse.json({ listaId: lista.id, nome: lista.nome, total: rows.length })
  } catch (error: any) {
    console.error("[POST /api/admin/email-massa/disparos/criar-lista]", error)
    return NextResponse.json({ error: "Erro ao criar lista" }, { status: 500 })
  }
}
