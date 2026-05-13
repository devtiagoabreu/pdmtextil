import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

interface FioImport {
  codigoFio?: string
  nome?: string
  nomeComercial?: string
  composicao?: string
  titulo?: string
  torcao?: string
  resistencia?: string
  alongamento?: string
  idIntegracao?: string
  ativo?: string
}

function parseCSV(texto: string): FioImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  if (linhas.length < 2) {
    console.log("[parseCSV] Linhas insuficientes:", linhas.length)
    return []
  }

  const separador = texto.includes(";") ? ";" : ","
  
  const primeiraLinha = linhas[0]
  const cabecalho = primeiraLinha.split(separador).map(c => c.trim().toLowerCase())
  
  console.log("[parseCSV] Separador:", separador)
  console.log("[parseCSV] Cabeçalho:", cabecalho)
  console.log("[parseCSV] Total de linhas:", linhas.length)
  
  const dados: FioImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: FioImport = {}
    
    for (let j = 0; j < cabecalho.length; j++) {
      if (valores[j] !== undefined && valores[j] !== "") {
        (item as any)[cabecalho[j]] = valores[j]
      }
    }
    
    console.log(`[parseCSV] Linha ${i + 1}:`, item)
    
    if (item.codigoFio || item.nome) {
      dados.push(item)
    }
  }

  console.log("[parseCSV] Total de registros:", dados.length)
  return dados
}

function parseJSON(texto: string): FioImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.codigoFio || item.nome)
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

    console.log("[POST /api/cadastros/fios/importar] Arquivo:", nomeArquivo)
    console.log("[POST /api/cadastros/fios/importar] Texto (primeiros 500 chars):", texto.substring(0, 500))

    let registros: FioImport[] = []

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

      if (!reg.codigoFio || !reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Código e Nome são obrigatórios" })
        continue
      }

      try {
        const existente = await db
          .select()
          .from(fios)
          .where(eq(fios.codigoFio, reg.codigoFio!))
          .limit(1)

        if (existente[0]) {
          resultados.erros.push({ linha: i + 2, erro: `Fio com código ${reg.codigoFio} já existe` })
          continue
        }

        const ativo = reg.ativo === "true" || reg.ativo === "1" || reg.ativo === "SIM"

        await db.insert(fios).values({
          codigoCompleto: `7.${reg.codigoFio}.XXX.000001`,
          codigoFio: reg.codigoFio!,
          nome: reg.nome!,
          nomeComercial: reg.nomeComercial || null,
          composicao: reg.composicao || null,
          titulo: reg.titulo || null,
          torcao: reg.torcao || null,
          resistencia: reg.resistencia || null,
          alongamento: reg.alongamento || null,
          idIntegracao: reg.idIntegracao || null,
          ativo: ativo,
          criadoPor: parseInt(session.user.id),
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        resultados.erros.push({ linha: i + 2, erro: err.message || "Erro desconhecido" })
      }
    }

    console.log("[POST /api/cadastros/fios/importar] Resultados:", resultados)

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/cadastros/fios/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}