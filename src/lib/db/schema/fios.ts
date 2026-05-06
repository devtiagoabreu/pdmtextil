import { pgTable, serial, varchar, boolean, text, integer, timestamp, numeric } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const fornecedores = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  razaoSocial: varchar("razao_social", { length: 250 }),
  email: varchar("email", { length: 150 }),
  telefone: varchar("telefone", { length: 20 }),
  contato: varchar("contato", { length: 100 }),
  endereco: varchar("endereco", { length: 300 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Fornecedor = typeof fornecedores.$inferSelect
export type NewFornecedor = typeof fornecedores.$inferInsert

export const fios = pgTable("fios", {
  id: serial("id").primaryKey(),
  codigoCompleto: varchar("codigo_completo", { length: 30 }).notNull().unique(),
  codigoFio: varchar("codigo_fio", { length: 10 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  nomeComercial: varchar("nome_comercial", { length: 200 }),
  composicao: varchar("composicao", { length: 200 }),
  titulo: varchar("titulo", { length: 20 }),
  torcao: varchar("torcao", { length: 20 }),
  resistencia: numeric("resistencia", { precision: 10, scale: 2 }),
  alongamento: numeric("alongamento", { precision: 5, scale: 2 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Fio = typeof fios.$inferSelect
export type NewFio = typeof fios.$inferInsert

export const fiosFornecedores = pgTable("fios_fornecedores", {
  id: serial("id").primaryKey(),
  fioId: integer("fio_id").notNull().references(() => fios.id, { onDelete: "cascade" }),
  fornecedorId: integer("fornecedor_id").notNull().references(() => fornecedores.id, { onDelete: "cascade" }),
  codigoFornecedor: varchar("codigo_fornecedor", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type FioFornecedor = typeof fiosFornecedores.$inferSelect
export type NewFioFornecedor = typeof fiosFornecedores.$inferInsert