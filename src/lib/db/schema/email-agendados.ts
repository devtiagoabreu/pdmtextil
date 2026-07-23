import { pgTable, serial, varchar, text, integer, timestamp, json } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const emailAgendados = pgTable("email_agendados", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull().default(""),
  para: varchar("para", { length: 50 }).notNull(),
  assunto: varchar("assunto", { length: 500 }).notNull().default(""),
  html: text("html").notNull().default(""),
  listas: json("listas").$type<number[]>(),
  modoEnvio: varchar("modo_envio", { length: 20 }).default("bcc"),
  remetente: varchar("remetente", { length: 20 }).default("sistema"),
  agendadoPara: timestamp("agendado_para"),
  status: varchar("status", { length: 20 }).notNull().default("rascunho"),
  enviadoEm: timestamp("enviado_em"),
  erro: text("erro"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type EmailAgendado = typeof emailAgendados.$inferSelect
export type NewEmailAgendado = typeof emailAgendados.$inferInsert
