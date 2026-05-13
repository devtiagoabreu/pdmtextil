import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"

interface ClienteImport {
  nome?: string
  cnpj?: string
  razaoSocial?: string
  email?: string
  telefone?: string
  contato?: string
  endereco?: string
  cidade?: string
  uf?: string
  idIntegracao?: string
}

const campoMap: Record<string, keyof ClienteImport> = {
  nome: "nome",
  cnpj: "cnpj",
  razaosocial: "razaoSocial",
  email: "email",
  telefone: "telefone",
  contato: "contato",
  endereco: "endereco",
  cidade: "cidade",
  uf: "uf",
  idintegracao: "idIntegracao",
}

function parseCSV(texto: string): ClienteImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  if (linhas.length < 2) return []

  const separador = texto.includes(";") ? ";" : ","
  const cabecalho = linhas[0].split(separador).map(c => c.trim().toLowerCase())
  
  const dados: ClienteImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: ClienteImport = {}
    
    for (let j = 0; j < cabecalho.length; j++) {
      const campoOriginal = cabecalho[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]
      
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    if (item.nome || item.cnpj) {
      dados.push(item)
    }
  }

  return dados
}

function parseJSON(texto: string): ClienteImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.nome || item.cnpj)
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

    let registros: ClienteImport[] = []

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

      if (!reg.nome || !reg.cnpj) {
        resultados.erros.push({ linha: i + 2, erro: "Nome e CNPJ são obrigatórios" })
        continue
      }

      try {
        const existente = await db
          .select()
          .from(clientes)
          .where(eq(clientes.cnpj, reg.cnpj))
          .limit(1)

        if (existente[0]) {
          resultados.erros.push({ linha: i + 2, erro: `Cliente com CNPJ ${reg.cnpj} já existe` })
          continue
        }

        await db.insert(clientes).values({
          nome: reg.nome,
          cnpj: reg.cnpj,
          razaoSocial: reg.razaoSocial || null,
          email: reg.email || null,
          telefone: reg.telefone || null,
          contato: reg.contato || null,
          endereco: reg.endereco || null,
          cidade: reg.cidade || null,
          uf: reg.uf || null,
          idIntegracao: reg.idIntegracao || null,
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        if (err.code === "23505") {
          resultados.erros.push({ linha: i + 2, erro: `CNPJ ${reg.cnpj} já cadastrado` })
        } else {
          resultados.erros.push({ linha: i + 2, erro: err.message || "Erro desconhecido" })
        }
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/clientes/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}