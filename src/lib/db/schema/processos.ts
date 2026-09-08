import { pgTable, serial, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core"

export const PROCESSO_STATUS = ["RASCUNHO", "APROVADO", "PADRONIZADO", "OBSOLETO"] as const
export type ProcessoStatus = (typeof PROCESSO_STATUS)[number]

export const ATIVIDADE_TIPOS = ["MANUAL", "AUTOMATICA", "DECISAO", "ESPERA"] as const
export type AtividadeTipo = (typeof ATIVIDADE_TIPOS)[number]

export const procEmpresas = pgTable("proc_empresas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  segmento: varchar("segmento", { length: 100 }),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcEmpresa = typeof procEmpresas.$inferSelect
export type NewProcEmpresa = typeof procEmpresas.$inferInsert

export const procSites = pgTable("proc_sites", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").notNull().references(() => procEmpresas.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 200 }).notNull(),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcSite = typeof procSites.$inferSelect
export type NewProcSite = typeof procSites.$inferInsert

export const procAreas = pgTable("proc_areas", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => procSites.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcArea = typeof procAreas.$inferSelect
export type NewProcArea = typeof procAreas.$inferInsert

export type ProcIndicador = { nome: string; unidade: string; meta: string; frequencia: string }
export type ProcRisco = { descricao: string; probabilidade: string; impacto: string; controle: string }
export type ProcControle = { descricao: string; responsavel: string; frequencia: string }

export const procProcessos = pgTable("proc_processos", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id").notNull().references(() => procAreas.id, { onDelete: "cascade" }),
  codigo: varchar("codigo", { length: 30 }),
  nome: varchar("nome", { length: 200 }).notNull(),
  objetivo: text("objetivo"),
  responsavel: varchar("responsavel", { length: 150 }),
  status: varchar("status", { length: 30 }).notNull().default("RASCUNHO"),
  versao: integer("versao").default(0),
  entradas: jsonb("entradas").$type<string[]>().default([]),
  saidas: jsonb("saidas").$type<string[]>().default([]),
  fornecedores: jsonb("fornecedores").$type<string[]>().default([]),
  clientes: jsonb("clientes").$type<string[]>().default([]),
  recursos: jsonb("recursos").$type<string[]>().default([]),
  sistemas: jsonb("sistemas").$type<string[]>().default([]),
  equipamentos: jsonb("equipamentos").$type<string[]>().default([]),
  indicadores: jsonb("indicadores").$type<ProcIndicador[]>().default([]),
  riscos: jsonb("riscos").$type<ProcRisco[]>().default([]),
  controles: jsonb("controles").$type<ProcControle[]>().default([]),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcProcesso = typeof procProcessos.$inferSelect
export type NewProcProcesso = typeof procProcessos.$inferInsert

export const procSubprocessos = pgTable("proc_subprocessos", {
  id: serial("id").primaryKey(),
  processoId: integer("processo_id").notNull().references(() => procProcessos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcSubprocesso = typeof procSubprocessos.$inferSelect
export type NewProcSubprocesso = typeof procSubprocessos.$inferInsert

export const procAtividades = pgTable("proc_atividades", {
  id: serial("id").primaryKey(),
  subprocessoId: integer("subprocesso_id").notNull().references(() => procSubprocessos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 200 }).notNull(),
  tipo: varchar("tipo", { length: 30 }).default("MANUAL"),
  responsavel: varchar("responsavel", { length: 150 }),
  ordem: integer("ordem").default(0),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type ProcAtividade = typeof procAtividades.$inferSelect
export type NewProcAtividade = typeof procAtividades.$inferInsert