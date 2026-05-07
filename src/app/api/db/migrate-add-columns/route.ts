// Migration manual para adicionar campo idIntegracao
// Rode no navegador: POST /api/db/migrate-add-columns

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar e adicionar colunas usando DO blocks para evitar erros se já existir
    const migrations = [
      // fornecedores
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'id_integracao') THEN
          ALTER TABLE fornecedores ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // fios
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'id_integracao') THEN
          ALTER TABLE fios ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // fios_fornecedores
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios_fornecedores' AND column_name = 'id_integracao') THEN
          ALTER TABLE fios_fornecedores ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // bases_urdume
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'id_integracao') THEN
          ALTER TABLE bases_urdume ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // cores_solidas
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cores_solidas' AND column_name = 'id_integracao') THEN
          ALTER TABLE cores_solidas ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // cores_fundo
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cores_fundo' AND column_name = 'id_integracao') THEN
          ALTER TABLE cores_fundo ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // estampas
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estampas' AND column_name = 'id_integracao') THEN
          ALTER TABLE estampas ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // clientes
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'id_integracao') THEN
          ALTER TABLE clientes ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // maquinas
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maquinas' AND column_name = 'id_integracao') THEN
          ALTER TABLE maquinas ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // operacoes
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operacoes' AND column_name = 'id_integracao') THEN
          ALTER TABLE operacoes ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // acabamentos
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acabamentos' AND column_name = 'id_integracao') THEN
          ALTER TABLE acabamentos ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // solicitacoes
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitacoes' AND column_name = 'id_integracao') THEN
          ALTER TABLE solicitacoes ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // anexos
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anexos' AND column_name = 'id_integracao') THEN
          ALTER TABLE anexos ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
      // usuarios
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'id_integracao') THEN
          ALTER TABLE usuarios ADD COLUMN "id_integracao" varchar(100);
        END IF;
      END $$`,
    ]

    const results = []
    for (const migration of migrations) {
      try {
        await db.execute(sql`${sql.raw(migration)}`)
        results.push({ status: "OK" })
      } catch (err) {
        results.push({ status: "ERROR", error: String(err) })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[POST /api/db/migrate-add-columns]", error)
    return NextResponse.json({ error: "Erro ao executar migration" }, { status: 500 })
  }
}