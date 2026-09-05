import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappDestinatarios } from "@/lib/db/schema/crm-whatsapp-destinatarios"
import { crmWhatsappBotLogs } from "@/lib/db/schema/crm-whatsapp-bot-logs"
import { usuarios } from "@/lib/db/schema/usuarios"
import { desc, inArray } from "drizzle-orm"
import { lerConfigMonitoramento, salvarConfigMonitoramento } from "@/lib/whatsapp/monitoramento"

export const dynamic = "force-dynamic"

type TipoPessoa = "pj" | "pf"

function ehAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUDO"
}

async function carregarDestinatarios() {
  const linhas = (await db
    .select({
      usuarioId: crmWhatsappDestinatarios.usuarioId,
      tipoPessoa: crmWhatsappDestinatarios.tipoPessoa,
    })
    .from(crmWhatsappDestinatarios)) as { usuarioId: number; tipoPessoa: string }[]

  const pj: number[] = []
  const pf: number[] = []
  for (const linha of linhas) {
    if (linha.tipoPessoa === "PJ") pj.push(linha.usuarioId)
    else if (linha.tipoPessoa === "PF") pf.push(linha.usuarioId)
  }
  return { pj, pf }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const [destinatarios, listaUsuarios, monitoramento, logs] = await Promise.all([
      carregarDestinatarios(),
      db
        .select({
          id: usuarios.id,
          name: usuarios.name,
          email: usuarios.email,
          role: usuarios.role,
          ativo: usuarios.ativo,
          celWhatsapp: usuarios.celWhatsapp,
        })
        .from(usuarios)
        .orderBy(desc(usuarios.ativo), usuarios.name),
      lerConfigMonitoramento().catch(() => null),
      db
        .select({
          id: crmWhatsappBotLogs.id,
          tipo: crmWhatsappBotLogs.tipo,
          origem: crmWhatsappBotLogs.origem,
          status: crmWhatsappBotLogs.status,
          detalhe: crmWhatsappBotLogs.detalhe,
          erro: crmWhatsappBotLogs.erro,
          createdAt: crmWhatsappBotLogs.createdAt,
        })
        .from(crmWhatsappBotLogs)
        .orderBy(desc(crmWhatsappBotLogs.createdAt))
        .limit(20),
    ])

    return NextResponse.json({ pj: destinatarios.pj, pf: destinatarios.pf, usuarios: listaUsuarios, monitoramento, logs })
  } catch (error) {
    console.error("[GET /api/admin/bot-config]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ehAdmin(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const entrada: Record<TipoPessoa, unknown> = { pj: body?.pj, pf: body?.pf }

    const ids: Record<TipoPessoa, number[]> = { pj: [], pf: [] }
    for (const tipo of ["pj", "pf"] as const) {
      const valor = entrada[tipo]
      if (!Array.isArray(valor)) {
        return NextResponse.json(
          { error: `Campo "${tipo}" deve ser uma lista de ids de usuários` },
          { status: 400 }
        )
      }
      const lista = valor
        .map((v: any) => Number(v))
        .filter((n: any) => Number.isInteger(n) && n > 0)
      ids[tipo] = [...new Set(lista)]
    }

    const todosIds = [...new Set([...ids.pj, ...ids.pf])]
    const usuariosEncontrados =
      todosIds.length > 0
        ? ((await db
            .select({ id: usuarios.id })
            .from(usuarios)
            .where(inArray(usuarios.id, todosIds))) as { id: number }[])
        : []
    const encontrados = new Set(usuariosEncontrados.map(u => u.id))
    for (const tipo of ["pj", "pf"] as const) {
      const invalido = ids[tipo].find(id => !encontrados.has(id))
      if (invalido) {
        return NextResponse.json(
          { error: `Usuário inválido para ${tipo === "pj" ? "PJ" : "PF"} (id ${invalido})` },
          { status: 400 }
        )
      }
    }

    const valores = [
      ...ids.pj.map(usuarioId => ({ usuarioId, tipoPessoa: "PJ" as const })),
      ...ids.pf.map(usuarioId => ({ usuarioId, tipoPessoa: "PF" as const })),
    ]

    await db.transaction(async (tx: any) => {
      await tx.delete(crmWhatsappDestinatarios)
      if (valores.length > 0) {
        await tx.insert(crmWhatsappDestinatarios).values(valores)
      }
    })

    const monitoramento = body?.monitoramento
    if (monitoramento !== undefined && monitoramento !== null) {
      if (
        typeof monitoramento.ativo !== "boolean" ||
        typeof monitoramento.emailAlerta !== "boolean" ||
        typeof monitoramento.notificacaoPdm !== "boolean"
      ) {
        return NextResponse.json(
          { error: "monitoramento deve conter ativo, emailAlerta e notificacaoPdm como booleanos" },
          { status: 400 }
        )
      }
      await salvarConfigMonitoramento({
        ativo: monitoramento.ativo,
        emailAlerta: monitoramento.emailAlerta,
        notificacaoPdm: monitoramento.notificacaoPdm,
      })
    }

    return NextResponse.json({ ok: true, pj: ids.pj, pf: ids.pf })
  } catch (error: any) {
    console.error("[PUT /api/admin/bot-config]", error)
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Destinatário duplicado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}