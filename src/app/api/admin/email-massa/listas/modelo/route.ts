import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const formato = searchParams.get("formato") || "csv"

    const campos = [
      { nome: "nome", descricao: "Nome do contato (obrigatório)", exemplo: "João Silva" },
      { nome: "email", descricao: "Email do contato (obrigatório)", exemplo: "joao@exemplo.com" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Contatos de Email",
        versao: "1.0",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["nome", "email"].includes(c.nome),
        })),
        exemplo: [
          { nome: "João Silva", email: "joao@exemplo.com" },
          { nome: "Maria Souza", email: "maria@exemplo.com" },
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
        "Content-Disposition": "attachment; filename=contatos_email_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/email-massa/listas/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
