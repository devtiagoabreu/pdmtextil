import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core"
import { crmVisitas } from "./crm-visitas"
import { usuarios } from "./usuarios"

export const crmPesquisasSatisfacao = pgTable("crm_pesquisas_satisfacao", {
  id: serial("id").primaryKey(),
  visitaId: integer("visita_id").notNull().references(() => crmVisitas.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  enviadoEm: timestamp("enviado_em"),
  abertoEm: timestamp("aberto_em"),
  respondidoEm: timestamp("respondido_em"),
  status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmPesquisaSatisfacao = typeof crmPesquisasSatisfacao.$inferSelect
export type NewCrmPesquisaSatisfacao = typeof crmPesquisasSatisfacao.$inferInsert
