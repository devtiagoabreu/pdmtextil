import { pgTable, serial, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const solicitacoes = pgTable("solicitacoes", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("PENDENTE"),
  solicitanteId: integer("solicitante_id").references(() => usuarios.id).notNull(),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  cliente: varchar("cliente", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  projeto: varchar("projeto", { length: 200 }),
  briefing: jsonb("briefing").notNull(),
  historicoComunicacao: jsonb("historico_comunicacao").default([]),
  observacoes: text("observacoes"),
  prazoDesejado: timestamp("prazo_desejado"),
  dataConclusao: timestamp("data_conclusao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
