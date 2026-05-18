import { pgTable, serial, varchar, integer, text, timestamp, numeric } from "drizzle-orm/pg-core"
import { produtoCruAcabamentoAmostra } from "./produto-cru"
import { produtosQuimicos } from "./produtos-quimicos"

export const produtoCruReceita = pgTable("produto_cru_receita", {
  id: serial("id").primaryKey(),
  amostraId: integer("amostra_id").notNull().references(() => produtoCruAcabamentoAmostra.id, { onDelete: "cascade" }),
  descricao: varchar("descricao", { length: 500 }).notNull(),
  instrucoes: text("instrucoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const produtoCruReceitaItem = pgTable("produto_cru_receita_item", {
  id: serial("id").primaryKey(),
  receitaId: integer("receita_id").notNull().references(() => produtoCruReceita.id, { onDelete: "cascade" }),
  quimicoId: integer("quimico_id").references(() => produtosQuimicos.id, { onDelete: "set null" }),
  descricao: varchar("descricao", { length: 300 }),
  unidade: varchar("unidade", { length: 20 }).notNull().default("g/L"),
  quantidadeMetro: numeric("quantidade_metro", { precision: 10, scale: 4 }).notNull(),
  estagio: varchar("estagio", { length: 10 }).notNull().default("A"),
  ordem: integer("ordem").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
})

export type ProdutoCruReceita = typeof produtoCruReceita.$inferSelect
export type NewProdutoCruReceita = typeof produtoCruReceita.$inferInsert
export type ProdutoCruReceitaItem = typeof produtoCruReceitaItem.$inferSelect
export type NewProdutoCruReceitaItem = typeof produtoCruReceitaItem.$inferInsert
