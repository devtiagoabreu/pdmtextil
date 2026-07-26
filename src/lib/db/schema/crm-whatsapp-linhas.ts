import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const crmWhatsAppLinhas = pgTable("crm_whatsapp_linhas", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type WhatsAppLinha = typeof crmWhatsAppLinhas.$inferSelect
export type NewWhatsAppLinha = typeof crmWhatsAppLinhas.$inferInsert
