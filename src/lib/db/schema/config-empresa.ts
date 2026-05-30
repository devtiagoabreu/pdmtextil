import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core"

export const configEmpresa = pgTable("config_empresa", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  documento: varchar("documento", { length: 20 }),
  endereco: varchar("endereco", { length: 300 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ConfigEmpresa = typeof configEmpresa.$inferSelect
export type NewConfigEmpresa = typeof configEmpresa.$inferInsert
