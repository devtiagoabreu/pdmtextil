import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const formato = searchParams.get("formato") || "csv"

    const campos = [
      { nome: "nome", descricao: "Nome / Fantasia do fornecedor", exemplo: "Fornecedor XYZ" },
      { nome: "cnpj", descricao: "CNPJ do fornecedor", exemplo: "12.345.678/0001-90" },
      { nome: "razaoSocial", descricao: "Razão Social (opcional)", exemplo: "Fornecedor XYZ Ltda" },
      { nome: "email", descricao: "Email de contato (opcional)", exemplo: "contato@fornecedor.com" },
      { nome: "telefone", descricao: "Telefone (opcional)", exemplo: "(11) 99999-9999" },
      { nome: "contato", descricao: "Pessoa de contato (opcional)", exemplo: "João Silva" },
      { nome: "endereco", descricao: "Endereço completo (opcional)", exemplo: "Rua exemplo, 100" },
      { nome: "cidade", descricao: "Cidade (opcional)", exemplo: "São Paulo" },
      { nome: "uf", descricao: "UF - Estado (opcional)", exemplo: "SP" },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM)", exemplo: "SYS001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Fornecedores",
        versao: "1.0",
        separador: ";",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["nome"].includes(c.nome),
        })),
        exemplo: [
          {
            nome: "Fornecedor XYZ",
            cnpj: "12.345.678/0001-90",
            razaoSocial: "Fornecedor XYZ Ltda",
            email: "contato@fornecedor.com",
            telefone: "(11) 99999-9999",
            contato: "João Silva",
            endereco: "Rua exemplo, 100",
            cidade: "São Paulo",
            uf: "SP",
            idIntegracao: "SYS001",
            ativo: "true",
          },
        ],
      }
      return NextResponse.json(estrutura)
    }

    const csvCabecalho = campos.map(c => c.nome).join(";")
    const csvExemplo = campos.map(c => c.exemplo).join(";")
    const csvCompleto = `${csvCabecalho}\n${csvExemplo}\n`

    return new NextResponse(csvCompleto, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=fornecedores_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/fornecedores/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}