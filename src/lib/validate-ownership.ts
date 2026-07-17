import { db } from "./db"
import { produtoCruAcabamento, produtoCruAcabamentoAmostra, produtoCruReceita, produtoCruReceitaItem } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function validateAcabamentoChain(id: number, aid: number) {
  const [acab] = await db
    .select()
    .from(produtoCruAcabamento)
    .where(and(eq(produtoCruAcabamento.id, aid), eq(produtoCruAcabamento.produtoCruId, id)))
    .limit(1)
  if (!acab) {
    return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
  }
  return null
}

export async function validateAmostraChain(id: number, aid: number, asid: number) {
  const [acab, amostra] = await Promise.all([
    db.select().from(produtoCruAcabamento)
      .where(and(eq(produtoCruAcabamento.id, aid), eq(produtoCruAcabamento.produtoCruId, id)))
      .limit(1),
    db.select().from(produtoCruAcabamentoAmostra)
      .where(eq(produtoCruAcabamentoAmostra.id, asid))
      .limit(1),
  ])
  if (!acab[0]) {
    return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
  }
  if (!amostra[0] || amostra[0].acabamentoId !== aid) {
    return NextResponse.json({ error: "Amostra não encontrada neste acabamento" }, { status: 404 })
  }
  return null
}

export async function validateReceitaChain(id: number, aid: number, asid: number, rid: number) {
  const [acab, amostra, receita] = await Promise.all([
    db.select().from(produtoCruAcabamento)
      .where(and(eq(produtoCruAcabamento.id, aid), eq(produtoCruAcabamento.produtoCruId, id)))
      .limit(1),
    db.select().from(produtoCruAcabamentoAmostra)
      .where(eq(produtoCruAcabamentoAmostra.id, asid))
      .limit(1),
    db.select().from(produtoCruReceita)
      .where(eq(produtoCruReceita.id, rid))
      .limit(1),
  ])
  if (!acab[0]) {
    return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
  }
  if (!amostra[0] || amostra[0].acabamentoId !== aid) {
    return NextResponse.json({ error: "Amostra não encontrada neste acabamento" }, { status: 404 })
  }
  if (!receita[0] || receita[0].amostraId !== asid) {
    return NextResponse.json({ error: "Receita não encontrada nesta amostra" }, { status: 404 })
  }
  return null
}

export async function validateItemChain(id: number, aid: number, asid: number, rid: number, iid: number) {
  const [acab, amostra, receita, item] = await Promise.all([
    db.select().from(produtoCruAcabamento)
      .where(and(eq(produtoCruAcabamento.id, aid), eq(produtoCruAcabamento.produtoCruId, id)))
      .limit(1),
    db.select().from(produtoCruAcabamentoAmostra)
      .where(eq(produtoCruAcabamentoAmostra.id, asid))
      .limit(1),
    db.select().from(produtoCruReceita)
      .where(eq(produtoCruReceita.id, rid))
      .limit(1),
    db.select().from(produtoCruReceitaItem)
      .where(eq(produtoCruReceitaItem.id, iid))
      .limit(1),
  ])
  if (!acab[0]) {
    return NextResponse.json({ error: "Acabamento não encontrado neste produto" }, { status: 404 })
  }
  if (!amostra[0] || amostra[0].acabamentoId !== aid) {
    return NextResponse.json({ error: "Amostra não encontrada neste acabamento" }, { status: 404 })
  }
  if (!receita[0] || receita[0].amostraId !== asid) {
    return NextResponse.json({ error: "Receita não encontrada nesta amostra" }, { status: 404 })
  }
  if (!item[0] || item[0].receitaId !== rid) {
    return NextResponse.json({ error: "Item não encontrado nesta receita" }, { status: 404 })
  }
  return null
}
