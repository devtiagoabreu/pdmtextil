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
import { emailListaContatos } from "@/lib/db/schema/email-listas"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq, and, or, SQL, sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

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
  "email-listas": { table: emailListaContatos, uniqueFields: ["email"] },
  pessoas: { table: crmPessoas, uniqueFields: ["cnpj", "cpf"] },
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

    const { entidade, integracaoId, fieldMapping, uniqueKey, items, listaId } = await req.json()

    if (!entidade || !integracaoId || !fieldMapping || !items?.length) {
      return NextResponse.json({ error: "entidade, integracaoId, fieldMapping e items são obrigatórios" }, { status: 400 })
    }

    const config = entityConfig[entidade]
    if (!config) {
      return NextResponse.json({ error: `Entidade '${entidade}' não suportada` }, { status: 400 })
    }

    const { table, uniqueFields } = config

    if (entidade === "email-listas" && !listaId) {
      return NextResponse.json({ error: "listaId é obrigatório para entidade email-listas" }, { status: 400 })
    }

    // Apply field mapping and normalize
    const mapped: Record<string, any>[] = items.map((item: Record<string, any>) => {
      const row: Record<string, any> = { idIntegracao: String(integracaoId) }
      if (entidade === "email-listas" && listaId) {
        row.listaId = Number(listaId)
      }
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
      // For email-listas, only check duplicates within the same list
      const listCondition = (entidade === "email-listas" && listaId)
        ? and(or(...conditions), sql`${sql.identifier("lista_id")} = ${Number(listaId)}`)
        : or(...conditions)
      const existing = await db.select({ [pdmUniqueKey]: table[pdmUniqueKey] })
        .from(table)
        .where(listCondition)
      existingRecords = new Set(existing.map((r: any) => String(r[pdmUniqueKey])))
    }

    const toInsert = mapped.filter((m: Record<string, any>) => {
      const val = String(m[pdmUniqueKey] ?? "")
      return !existingRecords.has(val)
    })
    const duplicatesCount = mapped.length - toInsert.length

    if (toInsert.length === 0) {
      return NextResponse.json({ importados: 0, duplicados: duplicatesCount, vazios: 0, message: `${duplicatesCount} registro(s) já existente(s) na base` })
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

    // Filter out rows where required (notNull) fields that are actually present in data are missing
    // Collect all field names that appear in any row
    const dataFields = new Set<string>()
    for (const row of cleaned) {
      for (const key of Object.keys(row)) dataFields.add(key)
    }
    const notNullFields = new Set<string>()
    for (const [key, col] of Object.entries(table)) {
      if (dataFields.has(key) && col && typeof col === "object" && "notNull" in col && (col as any).notNull) {
        notNullFields.add(key)
      }
    }
    const valid = cleaned.filter((row) => {
      for (const field of notNullFields) {
        if (row[field] === undefined || row[field] === null || row[field] === "") return false
      }
      return true
    })
    const skippedNull = cleaned.length - valid.length

    if (valid.length === 0) {
      return NextResponse.json({ importados: 0, duplicados: duplicatesCount, vazios: skippedNull, message: `${skippedNull} registro(s) com campos vazios, ${duplicatesCount} já existente(s)` })
    }

    await db.insert(table).values(valid)

    return NextResponse.json({
      importados: valid.length,
      duplicados: duplicatesCount,
      vazios: skippedNull,
      message: `${valid.length} importado(s), ${duplicatesCount} duplicado(s), ${skippedNull} com campos vazios`,
    })
  } catch (error) {
    console.error("[POST /api/integracao/importar]", error)
    return NextResponse.json(
      { error: "Erro interno ao importar dados" },
      { status: 500 }
    )
  }
}
