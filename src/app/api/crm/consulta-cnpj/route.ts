import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { like, or } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const cnpj = searchParams.get("cnpj")?.replace(/[^0-9]/g, "") || ""

    if (!cnpj || cnpj.length !== 14) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 })
    }

    let apiData = null
    try {
      const res = await fetch(`https://api.opencnpj.org/${cnpj}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) apiData = await res.json()
    } catch (err) {
      console.error("[consulta-cnpj] erro ao buscar API externa:", err)
    }

    const crmResult = await db
      .select()
      .from(crmPessoas)
      .where(like(crmPessoas.cnpj, `%${cnpj}%`))
      .limit(5)

    const clientesResult = await db
      .select()
      .from(clientes)
      .where(like(clientes.cnpj, `%${cnpj}%`))
      .limit(5)

    return NextResponse.json({ apiData, crmPessoas: crmResult, clientes: clientesResult })
  } catch (error) {
    console.error("[GET /api/crm/consulta-cnpj]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
