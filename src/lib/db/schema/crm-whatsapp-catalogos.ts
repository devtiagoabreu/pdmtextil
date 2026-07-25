import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const crmWhatsAppCatalogos = pgTable("crm_whatsapp_catalogos", {
  id: serial("id").primaryKey(),
  linhaNumero: integer("linha_numero").notNull(),
  linhaNome: varchar("linha_nome", { length: 100 }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  linkUrl: text("link_url").notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type WhatsAppCatalogo = typeof crmWhatsAppCatalogos.$inferSelect
export type NewWhatsAppCatalogo = typeof crmWhatsAppCatalogos.$inferInsert
