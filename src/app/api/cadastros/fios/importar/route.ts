import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
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

const campoMap: Record<string, keyof FioImport> = {
  codigofio: "codigoFio",
  nome: "nome",
  nomecomercial: "nomeComercial",
  composicao: "composicao",
  titulo: "titulo",
  torcao: "torcao",
  resistencia: "resistencia",
  alongamento: "alongamento",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}

function parseCSV(texto: string): FioImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  if (linhas.length < 2) {
    return []
  }

  const separador = texto.includes(";") ? ";" : ","
  
  const primeiraLinha = linhas[0]
  const cabecalhoLower = primeiraLinha.split(separador).map(c => c.trim().toLowerCase())
  
  const dados: FioImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: FioImport = {}
    
    for (let j = 0; j < cabecalhoLower.length; j++) {
      const campoOriginal = cabecalhoLower[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]
      
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    if (item.codigoFio || item.nome) {
      dados.push(item)
    }
  }

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
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const formData = await req.formData()
    const arquivo = formData.get("arquivo") as File | null

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const texto = await arquivo.text()
    const nomeArquivo = arquivo.name.toLowerCase()

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

    const paraInserir: Record<string, any>[] = []

    for (let i = 0; i < registros.length; i++) {
      const reg = registros[i]

      if (!reg.codigoFio || !reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Código e Nome são obrigatórios" })
        continue
      }

      if (reg.idIntegracao) {
        const existenteIdInt = await db
          .select()
          .from(fios)
          .where(eq(fios.idIntegracao, reg.idIntegracao))
          .limit(1)

        if (existenteIdInt[0]) {
          resultados.erros.push({ linha: i + 2, erro: `ID Integração ${reg.idIntegracao} já existe` })
          continue
        }
      }

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

      paraInserir.push({
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
        criadoPor: userIdResult,
      })
    }

    if (paraInserir.length > 0) {
      try {
        await db.insert(fios).values(paraInserir)
        resultados.importados = paraInserir.length
      } catch (err: any) {
        console.error("Erro na inserção em lote:", err)
        resultados.erros.push({ linha: 0, erro: err.message || "Erro ao inserir registros" })
      }
    }

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