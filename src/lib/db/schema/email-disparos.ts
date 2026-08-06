import { pgTable, serial, varchar, text, integer, timestamp, json } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const emailDisparos = pgTable("email_disparos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull().default(""),
  para: varchar("para", { length: 50 }).notNull(),
  listas: json("listas").$type<number[]>(),
  assunto: varchar("assunto", { length: 500 }).notNull().default(""),
  preheader: varchar("preheader", { length: 255 }).default(""),
  html: text("html").notNull().default(""),
  modoEnvio: varchar("modo_envio", { length: 20 }).default("bcc"),
  remetente: varchar("remetente", { length: 20 }).default("sistema"),
  remessaId: varchar("remessa_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("fila"),
  total: integer("total").default(0),
  enviados: integer("enviados").default(0),
  falhas: integer("falhas").default(0),
  erro: text("erro"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  criadoEm: timestamp("criado_em").defaultNow(),
  iniciadoEm: timestamp("iniciado_em"),
  concluidoEm: timestamp("concluido_em"),
})

export type EmailDisparo = typeof emailDisparos.$inferSelect
export type NewEmailDisparo = typeof emailDisparos.$inferInsert
