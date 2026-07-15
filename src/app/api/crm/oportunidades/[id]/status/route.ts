import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

async function sincronizarEmpresaCliente(empresaId: number) {
  const [empresa] = await db
    .select()
    .from(crmPessoas)
    .where(eq(crmPessoas.id, empresaId))
    .limit(1)

  if (!empresa || !empresa.cnpj) return
  if (empresa.clienteId) return // já vinculada

  const [existente] = await db
    .select()
    .from(clientes)
    .where(eq(clientes.cnpj, empresa.cnpj))
    .limit(1)

  if (existente) {
    await db
      .update(crmPessoas)
      .set({ clienteId: existente.id, updatedAt: new Date() })
      .where(eq(crmPessoas.id, empresaId))
    return
  }

  const [novoCliente] = await db
    .insert(clientes)
    .values({
      nome: empresa.nomeFantasia || empresa.razaoSocial || "",
      cnpj: empresa.cnpj!,
      razaoSocial: empresa.razaoSocial || "",
    })
    .returning()

  await db
    .update(crmPessoas)
    .set({ clienteId: novoCliente.id, updatedAt: new Date() })
    .where(eq(crmPessoas.id, empresaId))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const { status, motivoPerda } = await req.json()

    const [existente] = await db
      .select()
      .from(crmOportunidades)
      .where(eq(crmOportunidades.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 })
    }

    if (status === "FECHADO_PERDIDO" && !motivoPerda) {
      return NextResponse.json({ error: "Motivo da perda é obrigatório" }, { status: 400 })
    }

    const values: Record<string, any> = { status, updatedAt: new Date() }
    if (motivoPerda) values.motivoPerda = motivoPerda

    const [atualizada] = await db
      .update(crmOportunidades)
      .set(values)
      .where(eq(crmOportunidades.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "mover",
      descricao: `Oportunidade "${existente.titulo}" movida para ${status}`,
      entidade: "CrmOportunidade",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    if (existente.empresaId) {
      await inserirTimelineEvento({
        empresaId: existente.empresaId,
        tipo: "OPORTUNIDADE",
        descricao: `Oportunidade "${existente.titulo}" ${status === "FECHADO_GANHO" ? "GANHA" : status === "FECHADO_PERDIDO" ? "PERDIDA" : `movida para ${status}`}`,
        metadados: { oportunidadeId: atualizada.id, statusAnterior: existente.status, statusNovo: status, motivoPerda },
      })

      if (status === "FECHADO_GANHO") {
        await sincronizarEmpresaCliente(existente.empresaId)

        await inserirTimelineEvento({
          empresaId: existente.empresaId,
          tipo: "OPORTUNIDADE",
          descricao: `Empresa vinculada ao cadastro de Clientes PDM`,
          metadados: { oportunidadeId: atualizada.id },
        })
      }
    }

    await notificar("OPORTUNIDADE_STATUS", `Oportunidade "${existente.titulo}" movida para ${status}`, `/comercial/crm/oportunidades/${atualizada.id}`, session.user.name)

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/crm/oportunidades/[id]/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
