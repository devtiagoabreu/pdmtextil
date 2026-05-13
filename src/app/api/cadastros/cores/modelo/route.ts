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
      { nome: "codigo", descricao: "Código da cor (6 dígitos)", exemplo: "0001A1" },
      { nome: "nome", descricao: "Nome da cor", exemplo: "Azul Marinho" },
      { nome: "pantone", descricao: "Referência Pantone (opcional)", exemplo: "2955C" },
      { nome: "familia", descricao: "Família da cor (opcional)", exemplo: "AZUL" },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM)", exemplo: "SYS001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Cores Solidas",
        versao: "1.0",
        separador: ";",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["codigo", "nome"].includes(c.nome),
        })),
        exemplo: [
          {
            codigo: "0001A1",
            nome: "Azul Marinho",
            pantone: "2955C",
            familia: "AZUL",
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
        "Content-Disposition": "attachment; filename=cores_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/cores/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}