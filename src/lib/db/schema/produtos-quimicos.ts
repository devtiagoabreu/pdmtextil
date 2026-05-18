import { pgTable, serial, varchar, text, boolean, timestamp, numeric, integer } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

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

export type ProdutoQuimico = typeof produtosQuimicos.$inferSelect
export type NewProdutoQuimico = typeof produtosQuimicos.$inferInsert
