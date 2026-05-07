import { pgTable, serial, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core"

export const estampas = pgTable("estampas", {
  id: serial("id").primaryKey(),
  codigoDesenho: varchar("codigo_desenho", { length: 4 }).notNull(),
  variante: varchar("variante", { length: 2 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  imagemUrl: varchar("imagem_url", { length: 500 }),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Estampa = typeof estampas.$inferSelect
export type NewEstampa = typeof estampas.$inferInsert