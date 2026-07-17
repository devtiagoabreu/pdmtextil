import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailListas, emailListaContatos } from "@/lib/db/schema/email-listas"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

interface ContatoImport {
  nome?: string
  email?: string
}

const campoMap: Record<string, keyof ContatoImport> = {
  nome: "nome",
  email: "email",
}

function parseCSV(texto: string): ContatoImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())

  if (linhas.length < 2) return []

  const separador = texto.includes(";") ? ";" : ","
  const cabecalhoLower = linhas[0].split(separador).map(c => c.trim().toLowerCase())

  const dados: ContatoImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue

    const valores = linha.split(separador).map(v => v.trim())
    const item: ContatoImport = {}

    for (let j = 0; j < cabecalhoLower.length; j++) {
      const campoOriginal = cabecalhoLower[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]

      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        ;(item as any)[campoNormalizado] = valor
      }
    }

    if (item.nome || item.email) {
      dados.push(item)
    }
  }

  return dados
}

function parseJSON(texto: string): ContatoImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.nome || item.email)
    }
    return []
  } catch {
    return []
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const listaId = Number(id)

    const [lista] = await db.select().from(emailListas).where(eq(emailListas.id, listaId))
    if (!lista) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
    }

    const formData = await req.formData()
    const arquivo = formData.get("arquivo") as File | null

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const texto = await arquivo.text()
    const nomeArquivo = arquivo.name.toLowerCase()

    let registros: ContatoImport[] = []

    if (nomeArquivo.endsWith(".csv")) {
      registros = parseCSV(texto)
    } else if (nomeArquivo.endsWith(".json")) {
      registros = parseJSON(texto)
    } else {
      return NextResponse.json({ error: "Formato não suportado. Use CSV ou JSON." }, { status: 400 })
    }

    if (registros.length === 0) {
      return NextResponse.json({ error: "Nenhum registro válido encontrado no arquivo" }, { status: 400 })
    }

    const resultados = {
      total: registros.length,
      importados: 0,
      erros: [] as { linha: number; erro: string }[],
    }

    for (let i = 0; i < registros.length; i++) {
      const reg = registros[i]

      if (!reg.nome || !reg.email) {
        resultados.erros.push({ linha: i + 2, erro: "Nome e email são obrigatórios" })
        continue
      }

      if (!reg.email.includes("@")) {
        resultados.erros.push({ linha: i + 2, erro: `Email inválido: ${reg.email}` })
        continue
      }

      try {
        await db.insert(emailListaContatos).values({
          listaId,
          nome: reg.nome,
          email: reg.email,
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        resultados.erros.push({ linha: i + 2, erro: err.message || "Erro ao inserir contato" })
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} contatos importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/admin/email-massa/listas/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
