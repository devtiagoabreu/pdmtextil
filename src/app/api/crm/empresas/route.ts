import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, like, or, sql } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let conditions = []

    if (status) conditions.push(eq(crmEmpresas.status, status))
    if (search) {
      conditions.push(
        or(
          like(crmEmpresas.razaoSocial, `%${search}%`),
          like(crmEmpresas.nome, `%${search}%`),
          like(crmEmpresas.nomeFantasia, `%${search}%`),
          like(crmEmpresas.cnpj, `%${search}%`),
          like(crmEmpresas.cpf, `%${search}%`),
        )
      )
    }

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmEmpresas.id,
        tipoPessoa: crmEmpresas.tipoPessoa,
        nome: crmEmpresas.nome,
        razaoSocial: crmEmpresas.razaoSocial,
        nomeFantasia: crmEmpresas.nomeFantasia,
        cpf: crmEmpresas.cpf,
        cnpj: crmEmpresas.cnpj,
        segmento: crmEmpresas.segmento,
        porte: crmEmpresas.porte,
        status: crmEmpresas.status,
        responsavelId: crmEmpresas.responsavelId,
        responsavelNome: usuarios.name,
        ativo: crmEmpresas.ativo,
        createdAt: crmEmpresas.createdAt,
        updatedAt: crmEmpresas.updatedAt,
      })
      .from(crmEmpresas)
      .leftJoin(usuarios, eq(crmEmpresas.responsavelId, usuarios.id))
      .where(where)
      .orderBy(desc(crmEmpresas.createdAt))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/empresas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()
    const tipoPessoa = body.tipoPessoa || "PJ"
    const cnpj = body.cnpj?.replace(/[^a-zA-Z0-9]/g, "") || null
    const cpf = body.cpf?.replace(/[^0-9]/g, "") || null

    const [nova] = await db
      .insert(crmEmpresas)
      .values({
        tipoPessoa,
        nome: tipoPessoa === "PF" ? body.nome : null,
        razaoSocial: tipoPessoa === "PJ" ? body.razaoSocial : null,
        nomeFantasia: tipoPessoa === "PJ" ? (body.nomeFantasia || null) : null,
        cpf: tipoPessoa === "PF" ? cpf : null,
        cnpj: tipoPessoa === "PJ" ? cnpj : null,
        segmento: body.segmento || null,
        porte: body.porte || null,
        site: body.site || null,
        endereco: body.endereco || null,
        numero: body.numero || null,
        complemento: body.complemento || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        uf: body.uf || null,
        cep: body.cep || null,
        observacoes: body.observacoes || null,
        responsavelId: body.responsavelId || userId,
        status: "NOVO",
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Pessoa ${tipoPessoa === "PF" ? "Física" : "Jurídica"} criada: ${nova.nome || nova.razaoSocial}`,
      entidade: "CrmEmpresa",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Documento já cadastrado" }, { status: 409 })
    }
    console.error("[POST /api/crm/empresas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
