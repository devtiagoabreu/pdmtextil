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
      { nome: "codigoBase", descricao: "Código curto da base", exemplo: "UR001" },
      { nome: "codigoCompleto", descricao: "Código completo", exemplo: "4.UR001.CRU.000001" },
      { nome: "nome", descricao: "Nome da base", exemplo: "Base Algodão 30/1" },
      { nome: "descricao", descricao: "Descrição (opcional)", exemplo: "Base para tecido ringan" },
      { nome: "densidade", descricao: "Densidade (opcional)", exemplo: "30" },
      { nome: "tratamento", descricao: "Tratamento (opcional)", exemplo: "Engomagem" },
      { nome: "tensaoUrdume", descricao: "Tensão em kg (opcional)", exemplo: "25" },
      { nome: "largura", descricao: "Largura em metros (opcional)", exemplo: "2.50" },
      { nome: "observacoes", descricao: "Observações (opcional)", exemplo: "" },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM)", exemplo: "SYS001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Bases de Urdume",
        versao: "1.0",
        separador: ";",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["codigoBase", "codigoCompleto", "nome"].includes(c.nome),
        })),
        exemplo: [
          {
            codigoBase: "UR001",
            codigoCompleto: "4.UR001.CRU.000001",
            nome: "Base Algodão 30/1",
            descricao: "Base para tecido ringan",
            densidade: "30",
            tratamento: "Engomagem",
            tensaoUrdume: "25",
            largura: "2.50",
            observacoes: "",
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
        "Content-Disposition": "attachment; filename=bases_urdume_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/bases-urdume/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}