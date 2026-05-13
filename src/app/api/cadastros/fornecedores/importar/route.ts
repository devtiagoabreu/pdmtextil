import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

interface FornecedorImport {
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
  ativo?: string
}

const campoMap: Record<string, keyof FornecedorImport> = {
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
  ativo: "ativo",
}

function parseCSV(texto: string): FornecedorImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  if (linhas.length < 2) return []

  const separador = texto.includes(";") ? ";" : ","
  const cabecalho = linhas[0].split(separador).map(c => c.trim().toLowerCase())
  
  const dados: FornecedorImport[] = []

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    
    const valores = linha.split(separador).map(v => v.trim())
    
    const item: FornecedorImport = {}
    
    for (let j = 0; j < cabecalho.length; j++) {
      const campoOriginal = cabecalho[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]
      
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    if (item.nome) {
      dados.push(item)
    }
  }

  return dados
}

function parseJSON(texto: string): FornecedorImport[] {
  try {
    const dados = JSON.parse(texto)
    if (Array.isArray(dados)) {
      return dados.filter(item => item.nome)
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

    let registros: FornecedorImport[] = []

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

      if (!reg.nome) {
        resultados.erros.push({ linha: i + 2, erro: "Nome é obrigatório" })
        continue
      }

      try {
        if (reg.cnpj) {
          const cnpjLimpo = reg.cnpj.replace(/\D/g, "")
          const existenteCNPJ = await db
            .select()
            .from(fornecedores)
            .where(eq(fornecedores.cnpj, cnpjLimpo))
            .limit(1)

          if (existenteCNPJ[0]) {
            resultados.erros.push({ linha: i + 2, erro: `Fornecedor com CNPJ ${reg.cnpj} já existe` })
            continue
          }
        }

        const existenteNome = await db
          .select()
          .from(fornecedores)
          .where(eq(fornecedores.nome, reg.nome))
          .limit(1)

        if (existenteNome[0]) {
          resultados.erros.push({ linha: i + 2, erro: `Fornecedor ${reg.nome} já existe` })
          continue
        }

        const ativo = reg.ativo === "true" || reg.ativo === "1" || reg.ativo === "SIM"

        await db.insert(fornecedores).values({
          nome: reg.nome,
          cnpj: reg.cnpj ? reg.cnpj.replace(/\D/g, "") : null,
          razaoSocial: reg.razaoSocial || null,
          email: reg.email || null,
          telefone: reg.telefone || null,
          contato: reg.contato || null,
          endereco: reg.endereco || null,
          cidade: reg.cidade || null,
          uf: reg.uf || null,
          idIntegracao: reg.idIntegracao || null,
          ativo: ativo,
        })

        resultados.importados++
      } catch (err: any) {
        console.error(`Erro na linha ${i + 2}:`, err)
        const mensagemErro = err.code === '23505'
          ? `CNPJ ${reg.cnpj || 'desconhecido'} já cadastrado`
          : (err.message || "Erro ao inserir registro")
        resultados.erros.push({ linha: i + 2, erro: mensagemErro })
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `${resultados.importados} de ${resultados.total} registros importados`,
      ...resultados,
    })
  } catch (error) {
    console.error("[POST /api/cadastros/fornecedores/importar]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}