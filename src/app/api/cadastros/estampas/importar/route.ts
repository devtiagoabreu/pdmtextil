import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { estampas } from "@/lib/db/schema/estampas"
import { eq } from "drizzle-orm"

interface EstampaImport {
  codigoDesenho?: string
  variante?: string
  nome?: string
  tipo?: string
  imagemUrl?: string
  idIntegracao?: string
  ativo?: string
}

const campoMap: Record<string, keyof EstampaImport> = {
  codigodesenho: "codigoDesenho",
  variante: "variante",
  nome: "nome",
  tipo: "tipo",
  imagemurl: "imagemUrl",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}

function parseCSV(texto: string): EstampaImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  console.log("[parseCSV] Total de linhas:", linhas.length)
  
  if (linhas.length < 2) {
    console.log("[parseCSV] Linhas insuficientes:", linhas.length)
    return []
  }

  const separador = texto.includes(";") ? ";" : ","
  const primeiraLinha = linhas[0]
  const cabecalhoLower = primeiraLinha.split(separador).map(c => c.trim().toLowerCase())
  
  const dados: EstampaImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: EstampaImport = {}
    
    for (let j = 0; j < cabecalhoLower.length; j++) {
      const campoOriginal = cabecalhoLower[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]
      
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    console.log(`[parseCSV] Item ${i + 1}:`, item)
    
    if (item.codigoDesenho || item.nome) {
      dados.push(item)
    }
  }

  console.log("[parseCSV] Total de registros:", dados.length)
  return dados
}

function parseJSON(texto: string): EstampaImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.codigoDesenho || item.nome)
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

    console.log("[POST /api/cadastros/estampas/importar] Arquivo:", nomeArquivo)
    console.log("[POST /api/cadastros/estampas/importar] Texto (primeiros 500 chars):", texto.substring(0, 500))

    let registros: EstampaImport[] = []

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

      if (!reg.codigoDesenho || !reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Código do desenho e Nome são obrigatórios" })
        continue
      }

      try {
        const existente = await db
          .select()
          .from(estampas)
          .where(eq(estampas.codigoDesenho, reg.codigoDesenho))
          .limit(1)

        if (existente[0]) {
          resultados.erros.push({ linha: i + 2, erro: `Estampa com código ${reg.codigoDesenho} já existe` })
          continue
        }

        if (reg.idIntegracao) {
          const existenteIdInt = await db
            .select()
            .from(estampas)
            .where(eq(estampas.idIntegracao, reg.idIntegracao))
            .limit(1)

          if (existenteIdInt[0]) {
            resultados.erros.push({ linha: i + 2, erro: `ID Integração ${reg.idIntegracao} já existe` })
            continue
          }
        }

        const ativo = reg.ativo === "true" || reg.ativo === "1" || reg.ativo === "SIM"

        await db.insert(estampas).values({
          codigoDesenho: reg.codigoDesenho,
          variante: reg.variante || "01",
          nome: reg.nome,
          tipo: reg.tipo || null,
          imagemUrl: reg.imagemUrl || null,
          idIntegracao: reg.idIntegracao || null,
          ativo: ativo,
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        resultados.erros.push({ linha: i + 2, erro: err.message || "Erro desconhecido" })
      }
    }

    console.log("[POST /api/cadastros/estampas/importar] Resultados:", resultados)

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/cadastros/estampas/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}