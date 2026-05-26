import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const requisicoesCorte = pgTable("requisicoes_corte", {
  id: serial("id").primaryKey(),
  requisitanteId: integer("requisitante_id").references(() => usuarios.id).notNull(),
  codigoProduto: varchar("codigo_produto", { length: 100 }),
  ordem: varchar("ordem", { length: 100 }),
  artigo: varchar("artigo", { length: 200 }),
  cor: varchar("cor", { length: 100 }),
  desenho: varchar("desenho", { length: 100 }),
  quantidade: varchar("quantidade", { length: 50 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("SOLICITADO"),
  observacoes: text("observacoes"),
  entreguePor: varchar("entregue_por", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type RequisicaoCorte = typeof requisicoesCorte.$inferSelect
export type NewRequisicaoCorte = typeof requisicoesCorte.$inferInsert
