import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { coresSolidas } from "@/lib/db/schema/cores"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

interface CorImport {
  codigo?: string
  nome?: string
  pantone?: string
  familia?: string
  idIntegracao?: string
  ativo?: string
}

const campoMap: Record<string, keyof CorImport> = {
  codigo: "codigo",
  nome: "nome",
  pantone: "pantone",
  familia: "familia",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}

function parseCSV(texto: string): CorImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  if (linhas.length < 2) return []

  const separador = texto.includes(";") ? ";" : ","
  const cabecalho = linhas[0].split(separador).map(c => c.trim().toLowerCase())
  
  const dados: CorImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: CorImport = {}
    
    for (let j = 0; j < cabecalho.length; j++) {
      const campoOriginal = cabecalho[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]
      
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    if (item.codigo || item.nome) {
      dados.push(item)
    }
  }

  return dados
}

function parseJSON(texto: string): CorImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.codigo || item.nome)
    }
    return []
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const formData = await req.formData()
    const arquivo = formData.get("arquivo") as File | null

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const texto = await arquivo.text()
    const nomeArquivo = arquivo.name.toLowerCase()

    let registros: CorImport[] = []

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

      if (!reg.codigo || !reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Código e Nome são obrigatórios" })
        continue
      }

      try {
        const existente = await db
          .select()
          .from(coresSolidas)
          .where(eq(coresSolidas.codigo, reg.codigo))
          .limit(1)

        if (existente[0]) {
          resultados.erros.push({ linha: i + 2, erro: `Cor com código ${reg.codigo} já existe` })
          continue
        }

        if (reg.idIntegracao) {
          const existenteIdInt = await db
            .select()
            .from(coresSolidas)
            .where(eq(coresSolidas.idIntegracao, reg.idIntegracao))
            .limit(1)

          if (existenteIdInt[0]) {
            resultados.erros.push({ linha: i + 2, erro: `ID Integração ${reg.idIntegracao} já existe` })
            continue
          }
        }

        const ativo = reg.ativo === "true" || reg.ativo === "1" || reg.ativo === "SIM"

        await db.insert(coresSolidas).values({
          codigo: reg.codigo,
          nome: reg.nome,
          pantone: reg.pantone || null,
          familia: reg.familia || null,
          idIntegracao: reg.idIntegracao || null,
          ativo: ativo,
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        resultados.erros.push({ linha: i + 2, erro: err.message || "Erro desconhecido" })
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/cadastros/cores/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}