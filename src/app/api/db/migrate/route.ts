import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Criar tabela de fios
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "fios" (
        "id" serial PRIMARY KEY NOT NULL,
        "codigo_completo" varchar(30) NOT NULL,
        "codigo_fio" varchar(10) NOT NULL,
        "nome" varchar(200) NOT NULL,
        "nome_comercial" varchar(200),
        "composicao" varchar(200),
        "titulo" varchar(20),
        "torcao" varchar(20),
        "resistencia" numeric(10,2),
        "alongamento" numeric(5,2),
        "fornecedor" varchar(200),
        "observacoes" text,
        "ativo" boolean DEFAULT true,
        "criado_por" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `).catch(() => {})

    // Criar tabela de cores_solidas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cores_solidas" (
        "id" serial PRIMARY KEY NOT NULL,
        "codigo" varchar(6) NOT NULL,
        "nome" varchar(100) NOT NULL,
        "pantone" varchar(20),
        "familia" varchar(50),
        "ativo" boolean DEFAULT true
      );
    `).catch(() => {})

    // Criar tabela de cores_fundo
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cores_fundo" (
        "id" serial PRIMARY KEY NOT NULL,
        "codigo" varchar(3) NOT NULL,
        "nome" varchar(100) NOT NULL,
        "descricao" text,
        "ativo" boolean DEFAULT true
      );
    `).catch(() => {})

    // Criar tabela de acabamentos
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "acabamentos" (
        "id" serial PRIMARY KEY NOT NULL,
        "nome" varchar(100) NOT NULL,
        "descricao" text,
        "categoria" varchar(50),
        "ativo" boolean DEFAULT true
      );
    `).catch(() => {})

    // Criar tabela de maquinas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "maquinas" (
        "id" serial PRIMARY KEY NOT NULL,
        "codigo" varchar(30) NOT NULL,
        "nome" varchar(100) NOT NULL,
        "tipo" varchar(50),
        "velocidade_maxima" numeric(10,2),
        "capacidade_carga" numeric(10,2),
        "disponivel" boolean DEFAULT true,
        "ativo" boolean DEFAULT true
      );
    `).catch(() => {})

    // Criar tabela de operacoes
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "operacoes" (
        "id" serial PRIMARY KEY NOT NULL,
        "codigo" varchar(20) NOT NULL,
        "nome" varchar(100) NOT NULL,
        "tipo" varchar(50),
        "descricao" text,
        "ativo" boolean DEFAULT true
      );
    `).catch(() => {})

    // Adicionar unique constraints
    await db.execute(sql`ALTER TABLE "fios" ADD CONSTRAINT IF NOT EXISTS "fios_codigo_completo_unique" UNIQUE("codigo_completo");`).catch(() => {})
    await db.execute(sql`ALTER TABLE "fios" ADD CONSTRAINT IF NOT EXISTS "fios_codigo_fio_unique" UNIQUE("codigo_fio");`).catch(() => {})
    await db.execute(sql`ALTER TABLE "cores_solidas" ADD CONSTRAINT IF NOT EXISTS "cores_solidas_codigo_unique" UNIQUE("codigo");`).catch(() => {})
    await db.execute(sql`ALTER TABLE "cores_fundo" ADD CONSTRAINT IF NOT EXISTS "cores_fundo_codigo_unique" UNIQUE("codigo");`).catch(() => {})
    await db.execute(sql`ALTER TABLE "maquinas" ADD CONSTRAINT IF NOT EXISTS "maquinas_codigo_unique" UNIQUE("codigo");`).catch(() => {})
    await db.execute(sql`ALTER TABLE "operacoes" ADD CONSTRAINT IF NOT EXISTS "operacoes_codigo_unique" UNIQUE("codigo");`).catch(() => {})

    // Adicionar coluna idIntegracao às tabelas
    await db.execute(sql`ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE fios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE fios_fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE bases_urdume ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE cores_fundo ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE estampas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE acabamentos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE anexos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})
    await db.execute(sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);`).catch(() => {})

    return NextResponse.json({ success: true, message: "Tabelas criadas com sucesso" })
  } catch (error) {
    console.error("[POST /api/db/migrate]", error)
    return NextResponse.json({ error: "Erro ao criar tabelas" }, { status: 500 })
  }
}