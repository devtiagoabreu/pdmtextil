import { pgTable, serial, varchar, numeric, text, boolean, integer, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

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
  fornecedor: varchar("fornecedor", { length: 200 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Fio = typeof fios.$inferSelect
export type NewFio = typeof fios.$inferInsert