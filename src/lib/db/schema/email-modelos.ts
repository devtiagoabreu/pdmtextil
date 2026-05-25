import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core"

export const emailModelos = pgTable("email_modelos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  assunto: varchar("assunto", { length: 500 }).notNull().default(""),
  html: text("html").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type EmailModelo = typeof emailModelos.$inferSelect
export type NewEmailModelo = typeof emailModelos.$inferInsert
