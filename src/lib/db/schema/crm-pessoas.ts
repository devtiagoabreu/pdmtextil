import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { clientes } from "./clientes"

export const crmPessoas = pgTable("crm_pessoas", {
  id: serial("id").primaryKey(),
  tipoPessoa: varchar("tipo_pessoa", { length: 2 }).notNull().default("PJ"),
  nome: varchar("nome", { length: 250 }),
  razaoSocial: varchar("razao_social", { length: 250 }),
  nomeFantasia: varchar("nome_fantasia", { length: 200 }),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  segmento: varchar("segmento", { length: 100 }),
  porte: varchar("porte", { length: 50 }),
  site: varchar("site", { length: 255 }),
  endereco: varchar("endereco", { length: 300 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 200 }),
  bairro: varchar("bairro", { length: 150 }),
  cidade: varchar("cidade", { length: 150 }),
  uf: varchar("uf", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  observacoes: text("observacoes"),
  status: varchar("status", { length: 30 }).notNull().default("NOVO"),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  email: varchar("email", { length: 150 }),
  emailNf: varchar("email_nf", { length: 150 }),
  responsavelId: integer("responsavel_id").references(() => usuarios.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  resumoIa: text("resumo_ia"),
  sugestaoIa: text("sugestao_ia"),
  dataResumoIa: timestamp("data_resumo_ia"),
  ativo: boolean("ativo").default(true),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmPessoa = typeof crmPessoas.$inferSelect
export type NewCrmPessoa = typeof crmPessoas.$inferInsert
