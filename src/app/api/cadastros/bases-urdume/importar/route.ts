import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume } from "@/lib/db/schema/bases-urdume"
import type { NewBaseUrdume } from "@/lib/db/schema/bases-urdume"
import { eq } from "drizzle-orm"

interface BaseImport {
  codigoBase?: string
  codigoCompleto?: string
  nome?: string
  descricao?: string
  densidade?: string
  tratamento?: string
  tensaoUrdume?: string
  largura?: string
  observacoes?: string
  idIntegracao?: string
  ativo?: string
}

const campoMap: Record<string, keyof BaseImport> = {
  codigobase: "codigoBase",
  codigocompleto: "codigoCompleto",
  nome: "nome",
  descricao: "descricao",
  densidade: "densidade",
  tratamento: "tratamento",
  tensaourdume: "tensaoUrdume",
  largura: "largura",
  observacoes: "observacoes",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}

function parseCSV(texto: string): BaseImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())

  if (linhas.length < 2) {
    return []
  }

  const separador = texto.includes(";") ? ";" : ","
  const primeiraLinha = linhas[0]
  const cabecalhoLower = primeiraLinha.split(separador).map(c => c.trim().toLowerCase())

  const dados: BaseImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue

    const valores = linha.split(separador).map(v => v.trim())

    const item: BaseImport = {}

    for (let j = 0; j < cabecalhoLower.length; j++) {
      const campoOriginal = cabecalhoLower[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]

      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }

    if (item.codigoBase || item.nome) {
      dados.push(item)
    }
  }

  return dados
}

function parseJSON(texto: string): BaseImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.codigoBase || item.nome)
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

    let registros: BaseImport[] = []

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

    const paraInserir: NewBaseUrdume[] = []

    for (let i = 0; i < registros.length; i++) {
      const reg = registros[i]

      if (!reg.codigoBase || !reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Código e Nome são obrigatórios" })
        continue
      }

      const codigoCompletoGerado = reg.codigoCompleto || `${reg.codigoBase}.XXX.000001`

      const existenteCodigoBase = await db
        .select()
        .from(basesUrdume)
        .where(eq(basesUrdume.codigoBase, reg.codigoBase))
        .limit(1)

      if (existenteCodigoBase[0]) {
        resultados.erros.push({ linha: i + 2, erro: `Código base ${reg.codigoBase} já existe` })
        continue
      }

      const existenteCodigoCompleto = await db
        .select()
        .from(basesUrdume)
        .where(eq(basesUrdume.codigoCompleto, codigoCompletoGerado))
        .limit(1)

      if (existenteCodigoCompleto[0]) {
        resultados.erros.push({ linha: i + 2, erro: `Código completo ${codigoCompletoGerado} já existe` })
        continue
      }

      if (reg.idIntegracao) {
        const existenteIdInt = await db
          .select()
          .from(basesUrdume)
          .where(eq(basesUrdume.idIntegracao, reg.idIntegracao))
          .limit(1)

        if (existenteIdInt[0]) {
          resultados.erros.push({ linha: i + 2, erro: `ID Integração ${reg.idIntegracao} já existe` })
          continue
        }
      }

      const ativo = reg.ativo === "true" || reg.ativo === "1" || reg.ativo === "SIM"

      paraInserir.push({
        codigoBase: reg.codigoBase,
        codigoCompleto: codigoCompletoGerado,
        nome: reg.nome,
        descricao: reg.descricao || null,
        densidade: reg.densidade || null,
        tratamento: reg.tratamento || null,
        tensaoUrdume: reg.tensaoUrdume || null,
        largura: reg.largura || null,
        observacoes: reg.observacoes || null,
        idIntegracao: reg.idIntegracao || null,
        ativo: ativo,
        criadoPor: userIdResult,
      })
    }

    if (paraInserir.length > 0) {
      try {
        await db.insert(basesUrdume).values(paraInserir)
        resultados.importados = paraInserir.length
      } catch (err: any) {
        console.error("Erro na inserção em lote:", err)
        const mensagemErro = err.code === '23505'
          ? "Registro duplicado na importação"
          : (err.message || "Erro ao inserir registros")
        resultados.erros.push({ linha: 0, erro: mensagemErro })
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/cadastros/bases-urdume/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}