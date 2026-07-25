import { pgTable, serial, varchar, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core"

export const crmWhatsappFlowLogs = pgTable(
  "crm_whatsapp_flow_logs",
  {
    id: serial("id").primaryKey(),
    executionId: varchar("execution_id", { length: 36 }).notNull(),
    remoteJid: varchar("remote_jid", { length: 255 }),
    pushName: varchar("push_name", { length: 255 }),
    step: varchar("step", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("success"),
    input: jsonb("input").$type<Record<string, any>>().default({}),
    output: jsonb("output").$type<Record<string, any>>().default({}),
    error: text("error"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_flow_logs_execution_id").on(t.executionId),
    index("idx_flow_logs_created_at").on(t.createdAt),
    index("idx_flow_logs_status").on(t.status),
  ]
)

export type CrmWhatsappFlowLog = typeof crmWhatsappFlowLogs.$inferSelect
export type NewCrmWhatsappFlowLog = typeof crmWhatsappFlowLogs.$inferInsert
