import { pgTable, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const representantes = pgTable("representantes", {
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
  gerenteId: integer("gerente_id").references(() => usuarios.id),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Representante = typeof representantes.$inferSelect
export type NewRepresentante = typeof representantes.$inferInsert
