import { pgTable, serial, integer, varchar, text, timestamp, date, jsonb } from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"
import { crmOportunidades } from "./crm-oportunidades"
import { crmContatos } from "./crm-contatos"
import { usuarios } from "./usuarios"

export const crmVisitas = pgTable("crm_visitas", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").notNull().references(() => crmPessoas.id),
  oportunidadeId: integer("oportunidade_id").references(() => crmOportunidades.id),
  contatoId: integer("contato_id").references(() => crmContatos.id),
  dataVisita: date("data_visita").notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("PRESENCIAL"),
  status: varchar("status", { length: 20 }).notNull().default("AGENDADA"),
  endereco: varchar("endereco", { length: 300 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 200 }),
  bairro: varchar("bairro", { length: 150 }),
  cidade: varchar("cidade", { length: 150 }),
  uf: varchar("uf", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  motivoCancelamento: text("motivo_cancelamento"),
  relato: text("relato"),
  fotos: jsonb("fotos").$type<string[]>().default([]),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmVisita = typeof crmVisitas.$inferSelect
export type NewCrmVisita = typeof crmVisitas.$inferInsert
