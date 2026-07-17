import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    // Verificar se coluna já existe antes de adicionar
    const tables = [
      { name: "fornecedores", column: "id_integracao" },
      { name: "fios", column: "id_integracao" },
      { name: "fios_fornecedores", column: "id_integracao" },
      { name: "bases_urdume", column: "id_integracao" },
      { name: "cores_solidas", column: "id_integracao" },
      { name: "cores_fundo", column: "id_integracao" },
      { name: "estampas", column: "id_integracao" },
      { name: "clientes", column: "id_integracao" },
      { name: "maquinas", column: "id_integracao" },
      { name: "operacoes", column: "id_integracao" },
      { name: "acabamentos", column: "id_integracao" },
      { name: "solicitacoes", column: "id_integracao" },
      { name: "anexos", column: "id_integracao" },
      { name: "usuarios", column: "id_integracao" },
    ]

    const results = []

    for (const table of tables) {
      try {
        // Tentar adicionar a coluna (vai falhar se já existir, o que é OK)
        await db.execute(sql`
          ALTER TABLE ${sql.identifier(table.name)} ADD COLUMN ${sql.identifier(table.column)} varchar(100)
        `)
        results.push({ table: table.name, status: "ADDED" })
      } catch (e) {
        // Se der erro, provavelmente já existe
        results.push({ table: table.name, status: "EXISTS_OR_ERROR", error: String(e).substring(0, 50) })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[POST /api/db/add-id-integracao]", error)
    return NextResponse.json({ error: "Erro ao executar migration" }, { status: 500 })
  }
}