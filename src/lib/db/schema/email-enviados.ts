import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"
import { emailListas } from "./email-listas"

export const emailEnviados = pgTable("email_enviados", {
  id: serial("id").primaryKey(),
  listaId: integer("lista_id").references(() => emailListas.id),
  email: varchar("email", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  assunto: varchar("assunto", { length: 500 }).notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("enviado"),
  error: text("error"),
  trackingId: varchar("tracking_id", { length: 36 }).unique(),
  abertoEm: timestamp("aberto_em"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type EmailEnviado = typeof emailEnviados.$inferSelect
export type NewEmailEnviado = typeof emailEnviados.$inferInsert
