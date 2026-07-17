import { pgTable, serial, integer, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
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
}, (t) => [
  index("idx_notificacoes_usuario_lida").on(t.usuarioId, t.lida),
  index("idx_notificacoes_created_at").on(t.createdAt),
])

export type Notificacao = typeof notificacoes.$inferSelect
export type NewNotificacao = typeof notificacoes.$inferInsert
