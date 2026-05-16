import { pgTable, serial, varchar, text, integer, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { solicitacoes } from "./solicitacoes"
import { fios } from "./fios"
import { basesUrdume } from "./bases-urdume"

export const produtosCru = pgTable("produtos_cru", {
  id: serial("id").primaryKey(),
  codigoPdm: varchar("codigo_pdm", { length: 30 }).notNull().unique(),
  descricao: varchar("descricao", { length: 500 }).notNull(),
  solicitacaoDesenvolvimentoId: integer("solicitacao_desenvolvimento_id").references(() => solicitacoes.id),
  status: varchar("status", { length: 30 }).notNull().default("DESENVOLVIMENTO"),
  fichaTecnica: jsonb("ficha_tecnica").$type<{
    gramatura?: string
    largura?: string
    construcao?: string
    densidade?: string
    ligamento?: string
    observacoes?: string
  }>(),
  ativo: boolean("ativo").default(true),
  idIntegracaoErpCru: varchar("id_integracao_erp_cru", { length: 100 }),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProdutoCru = typeof produtosCru.$inferSelect
export type NewProdutoCru = typeof produtosCru.$inferInsert

export const produtoCruComposicao = pgTable("produto_cru_composicao", {
  id: serial("id").primaryKey(),
  produtoCruId: integer("produto_cru_id").notNull().references(() => produtosCru.id, { onDelete: "cascade" }),
  material: varchar("material", { length: 200 }).notNull(),
  percentual: numeric("percentual", { precision: 5, scale: 2 }).notNull(),
})

export type ProdutoCruComposicao = typeof produtoCruComposicao.$inferSelect
export type NewProdutoCruComposicao = typeof produtoCruComposicao.$inferInsert

export const produtoCruEstrutura = pgTable("produto_cru_estrutura", {
  id: serial("id").primaryKey(),
  produtoCruId: integer("produto_cru_id").notNull().references(() => produtosCru.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  fioId: integer("fio_id").references(() => fios.id),
  baseUrdumeId: integer("base_urdume_id").references(() => basesUrdume.id),
  ordem: integer("ordem"),
})

export type ProdutoCruEstrutura = typeof produtoCruEstrutura.$inferSelect
export type NewProdutoCruEstrutura = typeof produtoCruEstrutura.$inferInsert

export const produtoCruAmostra = pgTable("produto_cru_amostra", {
  id: serial("id").primaryKey(),
  produtoCruId: integer("produto_cru_id").notNull().references(() => produtosCru.id, { onDelete: "cascade" }),
  descricao: varchar("descricao", { length: 500 }),
  status: varchar("status", { length: 30 }).default("PENDENTE"),
  observacoes: text("observacoes"),
  data: timestamp("data").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type ProdutoCruAmostra = typeof produtoCruAmostra.$inferSelect
export type NewProdutoCruAmostra = typeof produtoCruAmostra.$inferInsert

export const produtoCruAcabamento = pgTable("produto_cru_acabamento", {
  id: serial("id").primaryKey(),
  produtoCruId: integer("produto_cru_id").notNull().references(() => produtosCru.id, { onDelete: "cascade" }),
  tipoAcabamento: varchar("tipo_acabamento", { length: 50 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  idIntegracaoErpAcabado: varchar("id_integracao_erp_acabado", { length: 100 }),
  possuiReceita: boolean("possui_receita").default(false),
})

export type ProdutoCruAcabamento = typeof produtoCruAcabamento.$inferSelect
export type NewProdutoCruAcabamento = typeof produtoCruAcabamento.$inferInsert

export const produtoCruAcabamentoAmostra = pgTable("produto_cru_acabamento_amostra", {
  id: serial("id").primaryKey(),
  acabamentoId: integer("acabamento_id").notNull().references(() => produtoCruAcabamento.id, { onDelete: "cascade" }),
  descricao: varchar("descricao", { length: 500 }),
  status: varchar("status", { length: 30 }).default("PENDENTE"),
  observacoes: text("observacoes"),
  data: timestamp("data").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type ProdutoCruAcabamentoAmostra = typeof produtoCruAcabamentoAmostra.$inferSelect
export type NewProdutoCruAcabamentoAmostra = typeof produtoCruAcabamentoAmostra.$inferInsert

export const produtoCruAcabamentoReceita = pgTable("produto_cru_acabamento_receita", {
  id: serial("id").primaryKey(),
  acabamentoId: integer("acabamento_id").notNull().references(() => produtoCruAcabamento.id, { onDelete: "cascade" }),
  tipoReceita: varchar("tipo_receita", { length: 50 }).notNull(),
  parametros: jsonb("parametros").default({}),
})

export type ProdutoCruAcabamentoReceita = typeof produtoCruAcabamentoReceita.$inferSelect
export type NewProdutoCruAcabamentoReceita = typeof produtoCruAcabamentoReceita.$inferInsert
