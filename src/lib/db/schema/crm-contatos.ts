import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"

export const crmContatos = pgTable("crm_contatos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cargo: varchar("cargo", { length: 100 }),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 255 }),
  principal: boolean("principal").default(false),
  observacoes: text("observacoes"),
  empresaId: integer("empresa_id").references(() => crmPessoas.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmContato = typeof crmContatos.$inferSelect
export type NewCrmContato = typeof crmContatos.$inferInsert
