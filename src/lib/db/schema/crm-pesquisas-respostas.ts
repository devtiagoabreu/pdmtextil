import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { crmPesquisasSatisfacao } from "./crm-pesquisas-satisfacao"

export const crmPesquisasRespostas = pgTable("crm_pesquisas_respostas", {
  id: serial("id").primaryKey(),
  pesquisaId: integer("pesquisa_id").notNull().references(() => crmPesquisasSatisfacao.id, { onDelete: "cascade" }),
  pergunta: varchar("pergunta", { length: 200 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("ALTERNATIVA"),
  resposta: text("resposta"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmPesquisaResposta = typeof crmPesquisasRespostas.$inferSelect
export type NewCrmPesquisaResposta = typeof crmPesquisasRespostas.$inferInsert
