import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { representantes } from "@/lib/db/schema/representantes"
import { clientesRepresentantes } from "@/lib/db/schema/clientes-representantes"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"
import { excluirRepresentanteCascade } from "@/lib/representante-cascade"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const resultado = await db
      .select()
      .from(representantes)
      .where(eq(representantes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Representante não encontrado" }, { status: 404 })
    }

    const clientesVinculados = await db
      .select({ id: clientes.id, nome: clientes.nome })
      .from(clientesRepresentantes)
      .innerJoin(clientes, eq(clientes.id, clientesRepresentantes.clienteId))
      .where(eq(clientesRepresentantes.representanteId, parseInt(id)))
      .orderBy(clientes.nome)

    return NextResponse.json({ ...resultado[0], clientes: clientesVinculados })
  } catch (error) {
    console.error("[GET /api/representantes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await req.json()

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, gerenteId, idIntegracao, clientesIds } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!cnpj?.trim()) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 })
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "")
    const existenteCNPJ = await db
      .select()
      .from(representantes)
      .where(eq(representantes.cnpj, cnpjLimpo))
      .limit(1)

    if (existenteCNPJ[0] && existenteCNPJ[0].id !== parseInt(id)) {
      return NextResponse.json({ error: "CNPJ já cadastrado em outro representante" }, { status: 409 })
    }

    if (idIntegracao) {
      const existenteIdInt = await db
        .select()
        .from(representantes)
        .where(eq(representantes.idIntegracao, idIntegracao))
        .limit(1)

      if (existenteIdInt[0] && existenteIdInt[0].id !== parseInt(id)) {
        return NextResponse.json({ error: "ID Integração já cadastrado em outro representante" }, { status: 409 })
      }
    }

    const repId = parseInt(id)
    const idsClientes = Array.isArray(clientesIds)
      ? clientesIds.map((c: any) => Number(c)).filter((n: number) => Number.isInteger(n) && n > 0)
      : []

    const [representanteAtualizado] = await db.transaction(async (tx: any) => {
      const [rep] = await tx
        .update(representantes)
        .set({
          nome: nome.trim(),
          cnpj: cnpjLimpo,
          razaoSocial: razaoSocial?.trim() || null,
          email: email?.trim() || null,
          telefone: telefone?.trim() || null,
          contato: contato?.trim() || null,
          endereco: endereco?.trim() || null,
          cidade: cidade?.trim() || null,
          uf: uf?.trim() || null,
          gerenteId: gerenteId || null,
          idIntegracao: idIntegracao || null,
          updatedAt: new Date(),
        })
        .where(eq(representantes.id, repId))
        .returning()

      await tx.delete(clientesRepresentantes).where(eq(clientesRepresentantes.representanteId, repId))

      if (idsClientes.length > 0) {
        await tx.insert(clientesRepresentantes).values(
          idsClientes.map((cid: number) => ({
            clienteId: cid,
            representanteId: repId,
          }))
        )
      }

      return [rep]
    })

    return NextResponse.json(representanteAtualizado)
  } catch (error: any) {
    console.error("[PUT /api/representantes/[id]]", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { id } = await params

    await db.transaction((tx: any) => excluirRepresentanteCascade(tx, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/representantes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
