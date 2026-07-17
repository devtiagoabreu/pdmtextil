import { pgTable, serial, varchar, text, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  acao: varchar("acao", { length: 100 }).notNull(),
  descricao: text("descricao"),
  entidade: varchar("entidade", { length: 100 }),
  entidadeId: integer("entidade_id"),
  dados: jsonb("dados"),
  erro: text("erro"),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  usuarioNome: varchar("usuario_nome", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_logs_tipo").on(t.tipo),
  index("idx_logs_created_at").on(t.createdAt),
  index("idx_logs_entidade").on(t.entidade, t.entidadeId),
])

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert
