import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume } from "@/lib/db/schema/bases-urdume"
import { estampas } from "@/lib/db/schema/estampas"
import { coresSolidas } from "@/lib/db/schema/cores"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const bases = await db.select().from(basesUrdume).limit(1)
    const cores = await db.select().from(coresSolidas).limit(1)
    const estampa = await db.select().from(estampas).limit(1)

    return NextResponse.json({
      bases_urdume: bases.length > 0,
      cores_solidas: cores.length > 0,
      estampas: estampa.length > 0,
    })
  } catch (error) {
    console.error("[GET /api/db/check-tables]", error)
    return NextResponse.json({ error: "Erro ao verificar tabelas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await db.insert(basesUrdume).values({
      codigoCompleto: "4.UR001.CRU.000001",
      codigoBase: "UR001",
      nome: "Base Algodão 30/1",
      descricao: "Base de urdume 100% algodão",
      densidade: "30",
      ativo: true,
    }).onConflictDoNothing()

    await db.insert(coresSolidas).values([
      { codigo: "0001A1", nome: "Azul Marinho", pantone: "2955C", familia: "AZUL", ativo: true },
      { codigo: "0002R1", nome: "Vermelho", pantone: "186C", familia: "VERMELHO", ativo: true },
      { codigo: "0003B1", nome: "Branco", pantone: "WHITE", familia: "BRANCO", ativo: true },
    ]).onConflictDoNothing()

    await db.insert(estampas).values([
      { codigoDesenho: "5001", variante: "01", nome: "Floral Botânico", tipo: "FLORAL", ativo: true },
      { codigoDesenho: "6001", variante: "01", nome: "Lista Grosso", tipo: "LISTRADO", ativo: true },
      { codigoDesenho: "7001", variante: "01", nome: "Poa Pequeno", tipo: "POA", ativo: true },
    ]).onConflictDoNothing()

    return NextResponse.json({ success: true, message: "Dados inseridos com sucesso!" })
  } catch (error) {
    console.error("[POST /api/db/seed-cadastros]", error)
    return NextResponse.json({ error: "Erro ao inserir dados" }, { status: 500 })
  }
}