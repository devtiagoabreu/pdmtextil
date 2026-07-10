import { pgTable, serial, varchar, text, integer, timestamp, date } from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"
import { crmOportunidades } from "./crm-oportunidades"
import { usuarios } from "./usuarios"

export const crmTarefas = pgTable("crm_tarefas", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => crmPessoas.id),
  oportunidadeId: integer("oportunidade_id").references(() => crmOportunidades.id),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 20 }).notNull().default("TAREFA"),
  dataPrevista: date("data_prevista"),
  dataConclusao: date("data_conclusao"),
  status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmTarefa = typeof crmTarefas.$inferSelect
export type NewCrmTarefa = typeof crmTarefas.$inferInsert
