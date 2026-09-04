import { pgTable, serial, varchar, jsonb, text, integer, timestamp } from "drizzle-orm/pg-core"

export const crmWhatsappFila = pgTable("crm_whatsapp_fila", {
  id: serial("id").primaryKey(),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull(),
  pushName: varchar("push_name", { length: 255 }),
  mensagem: text("mensagem").notNull(),
  executionId: varchar("execution_id", { length: 100 }),
  payload: jsonb("payload").$type<Record<string, any>>().default({}),
  status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
  tentativas: integer("tentativas").notNull().default(0),
  maxTentativas: integer("max_tentativas").notNull().default(3),
  ultimoErro: text("ultimo_erro"),
  processadoEm: timestamp("processado_em"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmWhatsappFila = typeof crmWhatsappFila.$inferSelect
export type NewCrmWhatsappFila = typeof crmWhatsappFila.$inferInsert
