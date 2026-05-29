import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { eq, or, sql } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { fieldMapping, uniqueKey, items } = await req.json()
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nenhum item para importar" }, { status: 400 })
    }

    let importados = 0
    let duplicatas = 0

    for (const item of items) {
      const mapped: Record<string, any> = {}

      // Apply field mapping: apiField -> pdmField
      for (const [apiField, pdmField] of Object.entries(fieldMapping)) {
        if (item[apiField] !== undefined) {
          mapped[pdmField as string] = item[apiField]
        }
      }

      // uniqueKey is an API field name; translate to PDM field name
      const pdmKeyField = (fieldMapping[uniqueKey] as string) || uniqueKey
      const keyValue = mapped[pdmKeyField]
      if (!keyValue) {
        duplicatas++
        continue
      }

      const existing = await db.select({ id: clientes.id })
        .from(clientes)
        .where(or(
          eq(clientes.idIntegracao, String(keyValue)),
          eq(clientes.cnpj, String(keyValue)),
        ))
        .limit(1)

      if (existing.length > 0) {
        duplicatas++
        continue
      }

      // Parse fields for insertion
      const insertData: Record<string, any> = {}

      if (mapped.nome) insertData.nome = String(mapped.nome)
      if (mapped.cnpj) insertData.cnpj = String(mapped.cnpj)
      if (mapped.razaoSocial) insertData.razaoSocial = String(mapped.razaoSocial)
      if (mapped.email) insertData.email = String(mapped.email)
      if (mapped.telefone) insertData.telefone = String(mapped.telefone)
      if (mapped.contato) insertData.contato = String(mapped.contato)
      if (mapped.endereco) insertData.endereco = String(mapped.endereco)
      if (mapped.cidade) insertData.cidade = String(mapped.cidade)
      if (mapped.uf) insertData.uf = String(mapped.uf)
      if (mapped.idIntegracao) insertData.idIntegracao = String(mapped.idIntegracao)
      insertData.ativo = mapped.ativo === true || mapped.ativo === "true" || mapped.ativo === 1

      if (!insertData.nome) {
        duplicatas++
        continue
      }

      await db.insert(clientes).values(insertData as any)
      importados++
    }

    return NextResponse.json({ importados, duplicatas })
  } catch (error) {
    console.error("[POST /api/cadastros/clientes/importar-api]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
