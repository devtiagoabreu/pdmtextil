import { pgTable, serial, varchar, boolean, text, integer, timestamp, numeric } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { fios } from "./fios"

export const basesUrdume = pgTable("bases_urdume", {
  id: serial("id").primaryKey(),
  codigoCompleto: varchar("codigo_completo", { length: 30 }).notNull().unique(),
  codigoBase: varchar("codigo_base", { length: 10 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  densidade: numeric("densidade", { precision: 6, scale: 2 }),
  tratamento: varchar("tratamento", { length: 100 }),
  tensaoUrdume: numeric("tensao_urdume", { precision: 6, scale: 2 }),
  largura: numeric("largura", { precision: 6, scale: 2 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const baseUrdumeFios = pgTable("base_urdume_fios", {
  id: serial("id").primaryKey(),
  baseUrdumeId: integer("base_urdume_id").notNull().references(() => basesUrdume.id, { onDelete: "cascade" }),
  fioId: integer("fio_id").notNull().references(() => fios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type BaseUrdume = typeof basesUrdume.$inferSelect
export type NewBaseUrdume = typeof basesUrdume.$inferInsert
export type BaseUrdumeFio = typeof baseUrdumeFios.$inferSelect
export type NewBaseUrdumeFio = typeof baseUrdumeFios.$inferInsert