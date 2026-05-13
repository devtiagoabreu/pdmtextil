import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq, and } from "drizzle-orm"

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
  const linhas = texto.split(/\r?\n/).filter(l => l.trim())
  if (linhas.length < 2) return []

  const separador = texto.includes(";") ? ";" : ","
  
  const cabecalho = linhas[0].split(separador).map(c => c.trim().toLowerCase())
  
  const dados: FioImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(separador).map(v => v.trim())
    
    if (valores.length < 2 || (valores.length === 1 && !valores[0])) {
      continue
    }
    
    const item: FioImport = {}
    
    cabecalho.forEach((campo, index) => {
      const valor = valores[index]
      if (valor && valor.length > 0) {
        (item as any)[campo] = valor
      }
    })
    
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
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

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