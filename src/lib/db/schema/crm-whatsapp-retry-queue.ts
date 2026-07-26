import { pgTable, serial, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core"

export const crmWhatsappRetryQueue = pgTable(
  "crm_whatsapp_retry_queue",
  {
    id: serial("id").primaryKey(),
    remoteJid: varchar("remote_jid", { length: 255 }).notNull(),
    mensagem: text("mensagem").notNull(),
    tentativas: integer("tentativas").notNull().default(0),
    maxTentativas: integer("max_tentativas").notNull().default(3),
    status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
    ultimoErro: text("ultimo_erro"),
    createdAt: timestamp("created_at").defaultNow(),
    proximoRetryAt: timestamp("proximo_retry_at").defaultNow(),
  },
  (t) => [
    index("idx_retry_queue_status").on(t.status),
    index("idx_retry_queue_proximo").on(t.proximoRetryAt),
  ]
)

export type CrmWhatsappRetryQueue = typeof crmWhatsappRetryQueue.$inferSelect
export type NewCrmWhatsappRetryQueue = typeof crmWhatsappRetryQueue.$inferInsert
