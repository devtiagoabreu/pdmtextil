import { pgTable, serial, varchar, jsonb, timestamp } from "drizzle-orm/pg-core"

export const crmWhatsappConversas = pgTable("crm_whatsapp_conversas", {
  id: serial("id").primaryKey(),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull().unique(),
  estado: varchar("estado", { length: 50 }).notNull().default("SAUDACAO"),
  dados: jsonb("dados").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmWhatsappConversa = typeof crmWhatsappConversas.$inferSelect
export type NewCrmWhatsappConversa = typeof crmWhatsappConversas.$inferInsert
