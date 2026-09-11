import { pgTable, serial, integer, varchar, text, timestamp, boolean, date, index } from "drizzle-orm/pg-core"

export const reunioesProjetos = pgTable("reunioes_projetos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  descricao: text("descricao"),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  status: varchar("status", { length: 20 }).notNull().default("EM_ANDAMENTO"),
  cor: varchar("cor", { length: 7 }),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t: any) => [
  index("idx_reunioes_projetos_status").on(t.status),
])

export const reunioes = pgTable("reunioes", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  projetoId: integer("projeto_id").notNull().default(1).references(() => reunioesProjetos.id),
  data: timestamp("data").notNull(),
  local: text("local"),
  status: varchar("status", { length: 20 }).notNull().default("AGENDADA"),
  resumoCurto: text("resumo_curto"),
  resumoDetalhado: text("resumo_detalhado"),
  resumoItensAcao: text("resumo_itens_acao"),
  transcricao: text("transcricao"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t: any) => [
  index("idx_reunioes_data").on(t.data),
  index("idx_reunioes_projeto_id").on(t.projetoId),
])

export const reuniaoAtas = pgTable("reuniao_atas", {
  id: serial("id").primaryKey(),
  reuniaoId: integer("reuniao_id").notNull().unique().references(() => reunioes.id, { onDelete: "cascade" }),
  conteudo: text("conteudo").notNull(),
  criadoPor: text("criado_por"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const reuniaoPautas = pgTable("reuniao_pautas", {
  id: serial("id").primaryKey(),
  reuniaoId: integer("reuniao_id").notNull().references(() => reunioes.id, { onDelete: "cascade" }),
  ordem: integer("ordem").notNull().default(0),
  descricao: text("descricao").notNull(),
}, (t: any) => [
  index("idx_reuniao_pautas_reuniao_id").on(t.reuniaoId),
])

export const reuniaoParticipantes = pgTable("reuniao_participantes", {
  id: serial("id").primaryKey(),
  reuniaoId: integer("reuniao_id").notNull().references(() => reunioes.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  empresa: text("empresa"),
  papel: text("papel"),
}, (t: any) => [
  index("idx_reuniao_participantes_reuniao_id").on(t.reuniaoId),
])

export const reuniaoEncaminhamentos = pgTable("reuniao_encaminhamentos", {
  id: serial("id").primaryKey(),
  reuniaoId: integer("reuniao_id").notNull().references(() => reunioes.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  responsavel: text("responsavel"),
  prazo: timestamp("prazo"),
  status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
}, (t: any) => [
  index("idx_reuniao_encaminhamentos_reuniao_id").on(t.reuniaoId),
])

export const reuniaoLinks = pgTable("reuniao_links", {
  id: serial("id").primaryKey(),
  reuniaoId: integer("reuniao_id").notNull().references(() => reunioes.id, { onDelete: "cascade" }),
  rotulo: text("rotulo").notNull(),
  url: text("url").notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t: any) => [
  index("idx_reuniao_links_reuniao_id").on(t.reuniaoId),
])

export type Reuniao = typeof reunioes.$inferSelect
export type NewReuniao = typeof reunioes.$inferInsert
export type ReuniaoProjeto = typeof reunioesProjetos.$inferSelect
export type NewReuniaoProjeto = typeof reunioesProjetos.$inferInsert
export type ReuniaoAta = typeof reuniaoAtas.$inferSelect
export type NewReuniaoAta = typeof reuniaoAtas.$inferInsert
export type ReuniaoPauta = typeof reuniaoPautas.$inferSelect
export type NewReuniaoPauta = typeof reuniaoPautas.$inferInsert
export type ReuniaoParticipante = typeof reuniaoParticipantes.$inferSelect
export type NewReuniaoParticipante = typeof reuniaoParticipantes.$inferInsert
export type ReuniaoEncaminhamento = typeof reuniaoEncaminhamentos.$inferSelect
export type NewReuniaoEncaminhamento = typeof reuniaoEncaminhamentos.$inferInsert
export type ReuniaoLink = typeof reuniaoLinks.$inferSelect
export type NewReuniaoLink = typeof reuniaoLinks.$inferInsert