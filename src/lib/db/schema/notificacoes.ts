import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const notificacoes = pgTable("notificacoes", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  mensagem: text("mensagem").notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  usuarioNome: varchar("usuario_nome", { length: 255 }),
  link: varchar("link", { length: 500 }),
  lida: boolean("lida").default(false),
  lidaEm: timestamp("lida_em"),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Notificacao = typeof notificacoes.$inferSelect
export type NewNotificacao = typeof notificacoes.$inferInsert
