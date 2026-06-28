import { pgTable, serial, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { produtosCru } from "./produto-cru"

export const requisicoesAmostraComercial = pgTable("requisicoes_amostra_comercial", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 30 }).notNull().default("PENDENTE"),
  solicitanteId: integer("solicitante_id").references(() => usuarios.id).notNull(),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  cliente: varchar("cliente", { length: 200 }),
  produtoCruId: integer("produto_cru_id").references(() => produtosCru.id).notNull(),
  solicitacaoDesenvolvimentoId: integer("solicitacao_desenvolvimento_id"),
  titulo: varchar("titulo", { length: 500 }),
  quantidade: varchar("quantidade", { length: 100 }),
  motivo: text("motivo"),
  observacoes: text("observacoes"),
  historico: jsonb("historico").default([]),
  prazoDesejado: timestamp("prazo_desejado"),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type RequisicaoAmostraComercial = typeof requisicoesAmostraComercial.$inferSelect
export type NewRequisicaoAmostraComercial = typeof requisicoesAmostraComercial.$inferInsert
