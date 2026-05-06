import { pgTable, serial, varchar, decimal, boolean } from "drizzle-orm/pg-core"

export const maquinas = pgTable("maquinas", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 30 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  velocidadeMaxima: decimal("velocidade_maxima", { precision: 10, scale: 2 }),
  capacidadeCarga: decimal("capacidade_carga", { precision: 10, scale: 2 }),
  disponivel: boolean("disponivel").default(true),
  ativo: boolean("ativo").default(true),
})

export type Maquina = typeof maquinas.$inferSelect
export type NewMaquina = typeof maquinas.$inferInsert

export const operacoes = pgTable("operacoes", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  tipo: varchar("tipo", { length: 50 }),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true),
})

export type Operacao = typeof operacoes.$inferSelect
export type NewOperacao = typeof operacoes.$inferInsert