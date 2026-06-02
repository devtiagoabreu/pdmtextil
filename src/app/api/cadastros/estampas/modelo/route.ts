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
      { nome: "codigoDesenho", descricao: "Código do desenho (4 dígitos)", exemplo: "5001" },
      { nome: "variante", descricao: "Variante do desenho (opcional)", exemplo: "01" },
      { nome: "nome", descricao: "Nome da estampa", exemplo: "Floral Botânico" },
      { nome: "tipo", descricao: "Tipo de estampa (opcional)", exemplo: "FLORAL" },
      { nome: "imagemUrl", descricao: "URL da imagem (opcional)", exemplo: "https://..." },
      { nome: "idIntegracao", descricao: "ID de integração (ERP/WMS/CRM)", exemplo: "SYS001" },
      { nome: "ativo", descricao: "Status ativo (true/false)", exemplo: "true" },
    ]

    if (formato === "json") {
      const estrutura = {
        modelo: "Estampas",
        versao: "1.0",
        separador: ";",
        campos: campos.map(c => ({
          nome: c.nome,
          descricao: c.descricao,
          exemplo: c.exemplo,
          obrigatorio: ["codigoDesenho", "nome"].includes(c.nome),
        })),
        exemplo: [
          {
            codigoDesenho: "5001",
            variante: "01",
            nome: "Floral Botânico",
            tipo: "FLORAL",
            imagemUrl: "",
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
        "Content-Disposition": "attachment; filename=estampas_modelo.csv",
      },
    })
  } catch (error) {
    console.error("[GET /api/cadastros/estampas/modelo]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}