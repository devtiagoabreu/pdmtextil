import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
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

    if (status) conditions.push(eq(crmPessoas.status, status))
    if (search) {
      conditions.push(
        or(
          like(crmPessoas.razaoSocial, `%${search}%`),
          like(crmPessoas.nome, `%${search}%`),
          like(crmPessoas.nomeFantasia, `%${search}%`),
          like(crmPessoas.cnpj, `%${search}%`),
          like(crmPessoas.cpf, `%${search}%`),
        )
      )
    }

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select({
        id: crmPessoas.id,
        tipoPessoa: crmPessoas.tipoPessoa,
        nome: crmPessoas.nome,
        razaoSocial: crmPessoas.razaoSocial,
        nomeFantasia: crmPessoas.nomeFantasia,
        cpf: crmPessoas.cpf,
        cnpj: crmPessoas.cnpj,
        segmento: crmPessoas.segmento,
        porte: crmPessoas.porte,
        status: crmPessoas.status,
        responsavelId: crmPessoas.responsavelId,
        responsavelNome: usuarios.name,
        ativo: crmPessoas.ativo,
        createdAt: crmPessoas.createdAt,
        updatedAt: crmPessoas.updatedAt,
      })
      .from(crmPessoas)
      .leftJoin(usuarios, eq(crmPessoas.responsavelId, usuarios.id))
      .where(where)
      .orderBy(desc(crmPessoas.createdAt))

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
      .insert(crmPessoas)
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
      entidade: "CrmPessoa",
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
