import { pgTable, serial, varchar, text, integer, timestamp, date } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const requisicoesCorte = pgTable("requisicoes_corte", {
  id: serial("id").primaryKey(),
  requisitanteId: integer("requisitante_id").references(() => usuarios.id).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("SOLICITADO"),
  observacoes: text("observacoes"),
  entreguePor: varchar("entregue_por", { length: 200 }),
  dataSolicitacao: date("data_solicitacao"),
  dataEntrega: date("data_entrega"),
  clienteId: integer("cliente_id"),
  clienteNome: varchar("cliente_nome", { length: 200 }),
  fornecedorId: integer("fornecedor_id"),
  fornecedorNome: varchar("fornecedor_nome", { length: 200 }),
  representanteId: integer("representante_id"),
  representanteNome: varchar("representante_nome", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const requisicoesCorteItens = pgTable("requisicoes_corte_itens", {
  id: serial("id").primaryKey(),
  requisicaoCorteId: integer("requisicao_corte_id").references(() => requisicoesCorte.id, { onDelete: "cascade" }).notNull(),
  codigoProduto: varchar("codigo_produto", { length: 100 }),
  ordem: varchar("ordem", { length: 100 }),
  artigo: varchar("artigo", { length: 200 }),
  cor: varchar("cor", { length: 100 }),
  desenho: varchar("desenho", { length: 100 }),
  quantidade: varchar("quantidade", { length: 50 }).notNull(),
  clienteId: integer("cliente_id"),
  clienteNome: varchar("cliente_nome", { length: 200 }),
  fornecedorId: integer("fornecedor_id"),
  fornecedorNome: varchar("fornecedor_nome", { length: 200 }),
  representanteId: integer("representante_id"),
  representanteNome: varchar("representante_nome", { length: 200 }),
})

export type RequisicaoCorte = typeof requisicoesCorte.$inferSelect
export type NewRequisicaoCorte = typeof requisicoesCorte.$inferInsert
export type RequisicaoCorteItem = typeof requisicoesCorteItens.$inferSelect
export type NewRequisicaoCorteItem = typeof requisicoesCorteItens.$inferInsert
