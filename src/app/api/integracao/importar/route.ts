import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { fornecedores, fios } from "@/lib/db/schema/fios"
import { coresSolidas, coresFundo } from "@/lib/db/schema/cores"
import { estampas } from "@/lib/db/schema/estampas"
import { basesUrdume } from "@/lib/db/schema/bases-urdume"
import { produtosQuimicos } from "@/lib/db/schema/produtos-quimicos"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq, and, or, SQL, sql } from "drizzle-orm"

const entityConfig: Record<string, { table: any; uniqueFields: string[]; idField?: string } | null> = {
  clientes: { table: clientes, uniqueFields: ["cnpj"] },
  fornecedores: { table: fornecedores, uniqueFields: ["cnpj"] },
  fios: { table: fios, uniqueFields: ["codigoFio", "codigoFioCompleto"] },
  coresSolidas: { table: coresSolidas, uniqueFields: ["codigo"] },
  coresFundo: { table: coresFundo, uniqueFields: ["codigo"] },
  estampas: { table: estampas, uniqueFields: ["codigoDesenho", "variante"] },
  basesUrdume: { table: basesUrdume, uniqueFields: ["codigoBase"] },
  produtosQuimicos: { table: produtosQuimicos, uniqueFields: ["codigo"] },
  produtosCru: { table: produtosCru, uniqueFields: ["codigoPdm"] },
}

function translateFieldName(pdmField: string): string {
  const map: Record<string, string> = {
    codigoFio: "codigo_fio",
    codigoFioCompleto: "codigo_completo",
    codigoBase: "codigo_base",
    codigoPdm: "codigo_pdm",
    nomeComercial: "nome_comercial",
    titulagemReal: "titulagem_real",
    unidadePadrao: "unidade_padrao",
    fichaSeguranca: "ficha_seguranca",
    codigoDesenho: "codigo_desenho",
    razaoSocial: "razao_social",
    idIntegracao: "id_integracao",
    links: "links",
    observacoes: "observacoes",
    descricao: "descricao",
    createdAt: "created_at",
    updatedAt: "updated_at",
    ativo: "ativo",
    nome: "nome",
    email: "email",
    telefone: "telefone",
    endereco: "endereco",
    cidade: "cidade",
    uf: "uf",
    cnpj: "cnpj",
    contato: "contato",
    codigo: "codigo",
    familia: "familia",
    pantone: "pantone",
    tipo: "tipo",
    imagemUrl: "imagem_url",
    densidade: "densidade",
    tratamento: "tratamento",
    tensaoUrdume: "tensao_urdume",
    largura: "largura",
    categoria: "categoria",
    concentracao: "concentracao",
    ph: "ph",
    composicao: "composicao",
    titulo: "titulo",
    ncm: "ncm",
    torcao: "torcao",
    resistencia: "resistencia",
    alongamento: "alongamento",
    fichaTecnica: "ficha_tecnica",
  }
  return map[pdmField] || pdmField
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { entidade, integracaoId, fieldMapping, uniqueKey, items } = await req.json()

    if (!entidade || !integracaoId || !fieldMapping || !items?.length) {
      return NextResponse.json({ error: "entidade, integracaoId, fieldMapping e items são obrigatórios" }, { status: 400 })
    }

    const config = entityConfig[entidade]
    if (!config) {
      return NextResponse.json({ error: `Entidade '${entidade}' não suportada` }, { status: 400 })
    }

    const { table, uniqueFields } = config

    // Apply field mapping and normalize
    const mapped: Record<string, any>[] = items.map((item: Record<string, any>) => {
      const row: Record<string, any> = { idIntegracao: String(integracaoId) }
      for (const [apiField, pdmField] of Object.entries(fieldMapping)) {
        if (item[apiField] !== undefined && item[apiField] !== null) {
          row[pdmField as string] = item[apiField]
        }
      }
      return row
    })

    // Dedup: check existing records by unique fields
    const pdmUniqueKey = fieldMapping[uniqueKey] || uniqueKey
    const dbUniqueFieldName = translateFieldName(pdmUniqueKey)

    const uniqueValues = (mapped
      .map((m: Record<string, any>) => m[pdmUniqueKey])
      .filter(Boolean) as string[])

    let existingRecords: Set<string> = new Set()
    if (uniqueValues.length > 0) {
      const conditions = uniqueValues.map(v => sql`${sql.identifier(dbUniqueFieldName)} = ${v}`)
      const existing = await db.select({ [pdmUniqueKey]: table[pdmUniqueKey] })
        .from(table)
        .where(or(...conditions))
      existingRecords = new Set(existing.map((r: any) => String(r[pdmUniqueKey])))
    }

    const toInsert = mapped.filter((m: Record<string, any>) => {
      const val = String(m[pdmUniqueKey] ?? "")
      return !existingRecords.has(val)
    })

    if (toInsert.length === 0) {
      return NextResponse.json({ importados: 0, ignorados: mapped.length, message: "Nenhum novo registro para importar" })
    }

    // Strip unknown fields - only keep columns that exist on the table
    const validFields = new Set(Object.keys(table))
    const cleaned = toInsert.map((row: Record<string, any>) => {
      const clean: Record<string, any> = {}
      for (const [key, val] of Object.entries(row)) {
        if (validFields.has(key)) clean[key] = val
      }
      return clean
    })

    await db.insert(table).values(cleaned)

    return NextResponse.json({
      importados: toInsert.length,
      ignorados: mapped.length - toInsert.length,
      message: `${toInsert.length} registro(s) importado(s), ${mapped.length - toInsert.length} ignorado(s) (já existentes)`,
    })
  } catch (error) {
    console.error("[POST /api/integracao/importar]", error)
    return NextResponse.json(
      { error: "Erro interno: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
