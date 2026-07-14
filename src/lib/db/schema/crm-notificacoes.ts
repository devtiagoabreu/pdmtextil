import { pgTable, serial, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core"

export const crmNotificacoes = pgTable("crm_notificacoes", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem"),
  tipo: varchar("tipo", { length: 50 }).notNull().default("lead_novo"),
  lida: boolean("lida").notNull().default(false),
  link: varchar("link", { length: 500 }),
  metadados: jsonb("metadados").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmNotificacao = typeof crmNotificacoes.$inferSelect
export type NewCrmNotificacao = typeof crmNotificacoes.$inferInsert
