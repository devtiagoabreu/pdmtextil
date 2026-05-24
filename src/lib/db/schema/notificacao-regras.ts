import { pgTable, serial, varchar, jsonb, timestamp } from "drizzle-orm/pg-core"

export const notificacaoRegras = pgTable("notificacao_regras", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull().unique(),
  roles: jsonb("roles").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type NotificacaoRegra = typeof notificacaoRegras.$inferSelect
export type NewNotificacaoRegra = typeof notificacaoRegras.$inferInsert
