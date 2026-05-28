import { pgTable, serial, varchar, json, boolean, timestamp } from "drizzle-orm/pg-core"

export const integracoes = pgTable("integracoes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  baseUrl: varchar("base_url", { length: 500 }).notNull(),
  tipoAuth: varchar("tipo_auth", { length: 30 }).notNull().default("bearer"),
  authConfig: json("auth_config").default({}),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Integracao = typeof integracoes.$inferSelect
export type NewIntegracao = typeof integracoes.$inferInsert
