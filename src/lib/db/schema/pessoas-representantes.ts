import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"
import { representantes } from "./representantes"

export const pessoasRepresentantes = pgTable("pessoas_representantes", {
  id: serial("id").primaryKey(),
  pessoaId: integer("pessoa_id").notNull().references(() => crmPessoas.id, { onDelete: "cascade" }),
  representanteId: integer("representante_id").notNull().references(() => representantes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type PessoaRepresentante = typeof pessoasRepresentantes.$inferSelect
export type NewPessoaRepresentante = typeof pessoasRepresentantes.$inferInsert
