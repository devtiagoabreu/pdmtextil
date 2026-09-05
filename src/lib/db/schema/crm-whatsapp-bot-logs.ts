import { pgTable, serial, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core"

export const crmWhatsappBotLogs = pgTable(
  "crm_whatsapp_bot_logs",
  {
    id: serial("id").primaryKey(),
    tipo: varchar("tipo", { length: 20 }).notNull(),
    origem: varchar("origem", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    detalhe: jsonb("detalhe").$type<Record<string, any>>().default({}),
    erro: text("erro"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t: any) => [
    index("idx_bot_logs_created_at").on(t.createdAt),
    index("idx_bot_logs_tipo").on(t.tipo),
    index("idx_bot_logs_status").on(t.status),
  ]
)

export type CrmWhatsappBotLog = typeof crmWhatsappBotLogs.$inferSelect
export type NewCrmWhatsappBotLog = typeof crmWhatsappBotLogs.$inferInsert