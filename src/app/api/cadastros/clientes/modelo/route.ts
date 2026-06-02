import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const formato = searchParams.get("formato") || "csv"

    const campos = [
      { nome: "nome", descricao: "Nome do cliente (obrigatório)", exemplo: "Cliente Exemplo Ltda" },
      { nome: "cnpj", descricao: "CNPJ do cliente (obrigatório)", exemplo: "12.345.678/0001-90" },
      { nome: "razaoSocial", descricao: "Razão Social", exemplo: "Cliente Exemplo Participações Ltda" },
      { nome: "email", descricao: "Email do cliente", exemplo: "contato@cliente.com.br" },
      { nome: "telefone", descricao: "Telefone", exemplo: "(11) 99999-8888" },
      { nome: "contato", descricao: "Nome do contato", exemplo: "João Silva" },
      { nome: "endereco", descricao: "Endereço completo", exemplo: "Rua das Flores, 123" },
      { nome: "cidade", descricao: "Cidade", exemplo: "São Paulo" },
      { nome: "uf", descricao: "UF (2 dígitos)", exemplo: "SP" },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM/OUTROS)", exemplo: "CLI001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Clientes",
        versao: "1.0",
        separador: ";",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["nome", "cnpj"].includes(c.nome),
        })),
        exemplo: [
          {
            nome: "Cliente Exemplo Ltda",
            cnpj: "12.345.678/0001-90",
            razaoSocial: "Cliente Exemplo Participações Ltda",
            email: "contato@cliente.com.br",
            telefone: "(11) 99999-8888",
            contato: "João Silva",
            endereco: "Rua das Flores, 123",
            cidade: "São Paulo",
            uf: "SP",
            idIntegracao: "CLI001",
            ativo: "true",
          },
        ],
      }
      return NextResponse.json(estrutura)
    }

    const csvCabecalho = campos.map(c => c.nome).join(";")
    const csvExemplo = campos.map(c => c.exemplo).join(";")
    const csvCompleto = `${csvCabecalho}\n${csvExemplo}\n`

    return new Response(csvCompleto, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=clientes_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/clientes/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}