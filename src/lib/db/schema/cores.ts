import { pgTable, serial, varchar, boolean, text } from "drizzle-orm/pg-core"

export const coresSolidas = pgTable("cores_solidas", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 6 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  pantone: varchar("pantone", { length: 20 }),
  familia: varchar("familia", { length: 50 }),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
})

export const coresFundo = pgTable("cores_fundo", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 3 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
})

export type CorSolida = typeof coresSolidas.$inferSelect
export type NewCorSolida = typeof coresSolidas.$inferInsert

export type CorFundo = typeof coresFundo.$inferSelect
export type NewCorFundo = typeof coresFundo.$inferInsert