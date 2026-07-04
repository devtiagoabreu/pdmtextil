import { pgTable, serial, varchar, text, integer, numeric, timestamp } from "drizzle-orm/pg-core"
import { crmOportunidades } from "./crm-oportunidades"
import { crmEmpresas } from "./crm-empresas"
import { usuarios } from "./usuarios"

export const crmPropostas = pgTable("crm_propostas", {
  id: serial("id").primaryKey(),
  oportunidadeId: integer("oportunidade_id").references(() => crmOportunidades.id),
  empresaId: integer("empresa_id").notNull().references(() => crmEmpresas.id),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }),
  descricao: text("descricao"),
  condicoesPagamento: text("condicoes_pagamento"),
  prazoEntrega: varchar("prazo_entrega", { length: 200 }),
  arquivoUrl: varchar("arquivo_url", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("ENVIADA"),
  dataEnvio: timestamp("data_envio"),
  dataResposta: timestamp("data_resposta"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmProposta = typeof crmPropostas.$inferSelect
export type NewCrmProposta = typeof crmPropostas.$inferInsert
