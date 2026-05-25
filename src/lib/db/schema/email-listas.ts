import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"

export const emailListas = pgTable("email_listas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const emailListaContatos = pgTable("email_lista_contatos", {
  id: serial("id").primaryKey(),
  listaId: integer("lista_id").notNull().references(() => emailListas.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type EmailLista = typeof emailListas.$inferSelect
export type NewEmailLista = typeof emailListas.$inferInsert
export type EmailListaContato = typeof emailListaContatos.$inferSelect
export type NewEmailListaContato = typeof emailListaContatos.$inferInsert
