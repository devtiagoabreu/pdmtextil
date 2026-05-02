import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core"

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  razaoSocial: varchar("razao_social", { length: 250 }),
  email: varchar("email", { length: 150 }),
  telefone: varchar("telefone", { length: 20 }),
  contato: varchar("contato", { length: 100 }),
  endereco: varchar("endereco", { length: 300 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Cliente = typeof clientes.$inferSelect
export type NewCliente = typeof clientes.$inferInsert