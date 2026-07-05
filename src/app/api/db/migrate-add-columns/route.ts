// Migration manual para adicionar campo idIntegracao
// Rode no navegador: POST /api/db/migrate-add-columns

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
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
      // bases_urdume: rename tratamento_encolagem -> tratamento
      `DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'tratamento_encolagem') THEN
          ALTER TABLE bases_urdume RENAME COLUMN tratamento_encolagem TO tratamento;
        END IF;
      END $$`,
      // bases_urdume: drop composicao_fios
      `DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'composicao_fios') THEN
          ALTER TABLE bases_urdume DROP COLUMN composicao_fios;
        END IF;
      END $$`,
      // base_urdume_fios table
      `CREATE TABLE IF NOT EXISTS base_urdume_fios (
        id SERIAL PRIMARY KEY,
        base_urdume_id INTEGER NOT NULL REFERENCES bases_urdume(id) ON DELETE CASCADE,
        fio_id INTEGER NOT NULL REFERENCES fios(id),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // fios: add titulagem_real
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'titulagem_real') THEN
          ALTER TABLE fios ADD COLUMN titulagem_real varchar(20);
        END IF;
      END $$`,
      // fios: add ncm
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'ncm') THEN
          ALTER TABLE fios ADD COLUMN ncm varchar(10);
        END IF;
      END $$`,
      // fios: add links
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'links') THEN
          ALTER TABLE fios ADD COLUMN links jsonb DEFAULT '[]';
        END IF;
      END $$`,
      // fios_fornecedores: add valor_unitario
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios_fornecedores' AND column_name = 'valor_unitario') THEN
          ALTER TABLE fios_fornecedores ADD COLUMN valor_unitario numeric(10,2);
        END IF;
      END $$`,
      // densidade numeric(6,2) -> numeric(8,2)
      `DO $$
      BEGIN
        ALTER TABLE bases_urdume ALTER COLUMN densidade TYPE numeric(8,2);
      END $$`,
      // crm_estados: add gerente_id
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_estados' AND column_name = 'gerente_id') THEN
          ALTER TABLE crm_estados ADD COLUMN gerente_id INTEGER REFERENCES usuarios(id);
        END IF;
      END $$`,
      // representantes table
      `CREATE TABLE IF NOT EXISTS representantes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cnpj VARCHAR(18) NOT NULL UNIQUE,
        razao_social VARCHAR(250),
        email VARCHAR(150),
        telefone VARCHAR(20),
        contato VARCHAR(100),
        endereco VARCHAR(300),
        cidade VARCHAR(100),
        uf VARCHAR(2),
        gerente_id INTEGER REFERENCES usuarios(id),
        ativo BOOLEAN DEFAULT true,
        id_integracao VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      // seed default permissions for existing roles
      `UPDATE roles SET permissions = '{
  "SOLICITACOES": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "PRODUTO_CRU": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "CADASTROS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "AMOSTRAS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "USUARIOS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "CONFIGURACOES": ["VIEW", "INSERT", "UPDATE", "DELETE"]
}'::jsonb, updated_at = NOW() WHERE ativo = true`,
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