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
      { nome: "codigoFio", descricao: "Código do fio (ex: AL20)", exemplo: "AL20" },
      { nome: "nome", descricao: "Nome completo do fio", exemplo: "Fio Algodão 20/1" },
      { nome: "nomeComercial", descricao: "Nome comercial (opcional)", exemplo: "Fio Premium" },
      { nome: "composicao", descricao: "Composição do fio", exemplo: "100% Algodão" },
      { nome: "titulo", descricao: "Título do fio", exemplo: "20/1" },
      { nome: "torcao", descricao: "Tipo de torção", exemplo: "Z" },
      { nome: "resistencia", descricao: "Resistência em kgf", exemplo: "120.50" },
      { nome: "alongamento", descricao: "Alongamento em %", exemplo: "8.5" },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM)", exemplo: "SYS001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Fios",
        versao: "1.0",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["codigoFio", "nome"].includes(c.nome),
        })),
        exemplo: [
          {
            codigoFio: "AL20",
            nome: "Fio Algodão 20/1",
            nomeComercial: "Fio Premium",
            composicao: "100% Algodão",
            titulo: "20/1",
            torcao: "Z",
            resistencia: "120.50",
            alongamento: "8.5",
            idIntegracao: "SYS001",
            ativo: "true",
          },
        ],
      }
      return NextResponse.json(estrutura)
    }

    const csvCabecalho = campos.map(c => c.nome).join(",")
    const csvExemplo = campos.map(c => c.exemplo).join(",")
    const csvCompleto = `${csvCabecalho}\n${csvExemplo}\n`

    return new NextResponse(csvCompleto, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=fios_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/fios/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}