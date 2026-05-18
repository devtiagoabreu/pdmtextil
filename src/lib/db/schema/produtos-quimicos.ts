import { pgTable, serial, varchar, text, boolean, timestamp, numeric, integer } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { sql } from "drizzle-orm"

export const produtosQuimicos = pgTable("produtos_quimicos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 100 }),
  unidadePadrao: varchar("unidade_padrao", { length: 20 }).notNull().default("kg"),
  tipo: varchar("tipo", { length: 50 }),
  concentracao: varchar("concentracao", { length: 50 }),
  densidade: numeric("densidade", { precision: 8, scale: 4 }),
  ph: numeric("ph", { precision: 4, scale: 1 }),
  observacoes: text("observacoes"),
  fichaSeguranca: varchar("ficha_seguranca", { length: 500 }),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  ativo: boolean("ativo").default(true),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const receitas = pgTable("produto_cru_receita", {
  id: serial("id").primaryKey(),
  amostraId: integer("amostra_id").notNull().references(() => sql`produto_cru_acabamento_amostra(id)`, { onDelete: "cascade" }),
  descricao: varchar("descricao", { length: 500 }).notNull(),
  instrucoes: text("instrucoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const receitaItens = pgTable("produto_cru_receita_item", {
  id: serial("id").primaryKey(),
  receitaId: integer("receita_id").notNull().references(() => receitas.id, { onDelete: "cascade" }),
  quimicoId: integer("quimico_id").references(() => produtosQuimicos.id, { onDelete: "set null" }),
  descricao: varchar("descricao", { length: 300 }),
  unidade: varchar("unidade", { length: 20 }).notNull().default("g/L"),
  quantidadeMetro: numeric("quantidade_metro", { precision: 10, scale: 4 }).notNull(),
  estagio: varchar("estagio", { length: 10 }).notNull().default("A"),
  ordem: integer("ordem").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
})

export type ProdutoQuimico = typeof produtosQuimicos.$inferSelect
export type NewProdutoQuimico = typeof produtosQuimicos.$inferInsert
export type Receita = typeof receitas.$inferSelect
export type NewReceita = typeof receitas.$inferInsert
export type ReceitaItem = typeof receitaItens.$inferSelect
export type NewReceitaItem = typeof receitaItens.$inferInsert
