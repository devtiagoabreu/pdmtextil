import { db } from "./db"
import { produtoCruAcabamento, produtoCruAcabamentoAmostra, produtoCruReceita, produtoCruReceitaItem } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function validateAcabamentoChain(id: number, aid: number) {
  const [acab] = await db
    .select()
    .from(produtoCruAcabamento)
    .where(eq(produtoCruAcabamento.id, aid))
    .limit(1)
  if (!acab || acab.produtoCruId !== id) {
    return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
  }
  return null
}

export async function validateAmostraChain(id: number, aid: number, asid: number) {
  const r1 = await validateAcabamentoChain(id, aid)
  if (r1) return r1

  const [amostra] = await db
    .select()
    .from(produtoCruAcabamentoAmostra)
    .where(eq(produtoCruAcabamentoAmostra.id, asid))
    .limit(1)
  if (!amostra || amostra.acabamentoId !== aid) {
    return NextResponse.json({ error: "Amostra não encontrada neste acabamento" }, { status: 404 })
  }
  return null
}

export async function validateReceitaChain(id: number, aid: number, asid: number, rid: number) {
  const r1 = await validateAmostraChain(id, aid, asid)
  if (r1) return r1

  const [receita] = await db
    .select()
    .from(produtoCruReceita)
    .where(eq(produtoCruReceita.id, rid))
    .limit(1)
  if (!receita || receita.amostraId !== asid) {
    return NextResponse.json({ error: "Receita não encontrada nesta amostra" }, { status: 404 })
  }
  return null
}

export async function validateItemChain(id: number, aid: number, asid: number, rid: number, iid: number) {
  const r1 = await validateReceitaChain(id, aid, asid, rid)
  if (r1) return r1

  const [item] = await db
    .select()
    .from(produtoCruReceitaItem)
    .where(eq(produtoCruReceitaItem.id, iid))
    .limit(1)
  if (!item || item.receitaId !== rid) {
    return NextResponse.json({ error: "Item não encontrado nesta receita" }, { status: 404 })
  }
  return null
}
