import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, getUserId } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosQuimicos } from "@/lib/db/schema/produtos-quimicos"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userIdResult = getUserId(session)
    if (userIdResult instanceof NextResponse) return userIdResult

    const form = await req.formData()
    const file = form.get("file") as File
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

    const text = await file.text()
    const lines = text.split("\n").filter(Boolean)
    const isJson = file.name.endsWith(".json")

    let imported = 0
    let errors: string[] = []

    if (isJson) {
      const data = JSON.parse(text)
      for (const item of Array.isArray(data) ? data : [data]) {
        try {
          await db.insert(produtosQuimicos).values({
            codigo: item.codigo,
            nome: item.nome,
            descricao: item.descricao || null,
            categoria: item.categoria || null,
            unidadePadrao: item.unidadePadrao || "kg",
            tipo: item.tipo || null,
            concentracao: item.concentracao || null,
            densidade: item.densidade || null,
            ph: item.ph || null,
            idIntegracao: item.idIntegracao || null,
            ativo: true,
            criadoPor: userIdResult,
          })
          imported++
        } catch (e: any) {
          errors.push(`Erro ao importar ${item.codigo || item.nome}: ${e.message}`)
        }
      }
    } else {
      const headerLine = lines[0].toLowerCase()
      const delimiter = headerLine.includes(";") ? ";" : ","
      const startIndex = headerLine.includes("codigo") || headerLine.includes("código") || headerLine.includes("nome") ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(delimiter)
        if (parts.length < 2) continue
        try {
          await db.insert(produtosQuimicos).values({
            codigo: parts[0].trim(),
            nome: parts[1].trim(),
            descricao: parts[2]?.trim() || null,
            categoria: parts[3]?.trim() || null,
            unidadePadrao: parts[4]?.trim() || "kg",
            tipo: parts[5]?.trim() || null,
            concentracao: parts[6]?.trim() || null,
            idIntegracao: parts[7]?.trim() || null,
            ativo: true,
            criadoPor: userIdResult,
          })
          imported++
        } catch (e: any) {
          errors.push(`Erro ao importar ${parts[0]}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({ imported, errors })
  } catch (error) {
    console.error("[POST /api/cadastros/produtos-quimicos/import]", error)
    return NextResponse.json({ error: "Erro ao importar" }, { status: 500 })
  }
}
