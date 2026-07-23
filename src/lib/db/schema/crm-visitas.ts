import { pgTable, serial, integer, varchar, text, timestamp, date, jsonb, doublePrecision } from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"
import { crmOportunidades } from "./crm-oportunidades"
import { crmContatos } from "./crm-contatos"
import { clientes } from "./clientes"
import { usuarios } from "./usuarios"

export const crmVisitas = pgTable("crm_visitas", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => crmPessoas.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  oportunidadeId: integer("oportunidade_id").references(() => crmOportunidades.id),
  contatoId: integer("contato_id").references(() => crmContatos.id),
  dataVisita: date("data_visita").notNull(),
  hora: varchar("hora", { length: 5 }),
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
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLat: doublePrecision("check_in_lat"),
  checkInLng: doublePrecision("check_in_lng"),
  checkOutLat: doublePrecision("check_out_lat"),
  checkOutLng: doublePrecision("check_out_lng"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  duracaoEstimada: integer("duracao_estimada"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmVisita = typeof crmVisitas.$inferSelect
export type NewCrmVisita = typeof crmVisitas.$inferInsert
