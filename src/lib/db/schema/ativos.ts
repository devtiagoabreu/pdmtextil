import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { maquinas } from "./maqoper"
import { usuarios } from "./usuarios"
import { procAreas } from "./processos"

export const ATIVO_STATUS = ["ATIVO", "MANUTENCAO", "INATIVO", "BAIXADO"] as const
export type AtivoStatus = (typeof ATIVO_STATUS)[number]

export const VISTORIA_PERIODICIDADE = [
  "DIARIA",
  "SEMANAL",
  "MENSAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "BIENAL",
  "TRIENAL",
  "QUINQUENAL",
  "OUTRA",
] as const
export type VistoriaPeriodicidade = (typeof VISTORIA_PERIODICIDADE)[number]

export const VISTORIA_ITEM_TIPO = ["SIM_NAO", "OK_OBS", "VALOR", "TEXTO"] as const
export type VistoriaItemTipo = (typeof VISTORIA_ITEM_TIPO)[number]

export const VISTORIA_STATUS = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "NAO_CONFORME",
  "CANCELADA",
] as const
export type VistoriaStatus = (typeof VISTORIA_STATUS)[number]

export const VISTORIA_RESULTADO = ["CONFORME", "PARCIAL", "NAO_CONFORME"] as const
export type VistoriaResultado = (typeof VISTORIA_RESULTADO)[number]

export type VistoriaItemTemplate = {
  ordem: number
  pergunta: string
  tipo: VistoriaItemTipo
  obrigatorio?: boolean
  unidade?: string
}

export type VistoriaResposta = {
  ordem: number
  valor: string | number | null
  observacao?: string
  conforme: boolean
}

export const ativoCategorias = pgTable("ativos_categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  areaId: integer("area_id")
    .notNull()
    .references(() => procAreas.id, { onDelete: "no action" }),
  descricao: text("descricao"),
  cor: varchar("cor", { length: 20 }),
  icone: varchar("icone", { length: 50 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type AtivoCategoria = typeof ativoCategorias.$inferSelect
export type NewAtivoCategoria = typeof ativoCategorias.$inferInsert

export const ativos = pgTable("ativos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 40 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  categoriaId: integer("categoria_id")
    .notNull()
    .references(() => ativoCategorias.id, { onDelete: "cascade" }),
  localizacao: varchar("localizacao", { length: 200 }),
  fabricante: varchar("fabricante", { length: 150 }),
  modelo: varchar("modelo", { length: 150 }),
  numSerie: varchar("num_serie", { length: 100 }),
  anoFabricacao: integer("ano_fabricacao"),
  dataAquisicao: date("data_aquisicao"),
  valorAquisicao: numeric("valor_aquisicao", { precision: 12, scale: 2 }),
  valorResidual: numeric("valor_residual", { precision: 12, scale: 2 }),
  vidaUtilAnos: integer("vida_util_anos"),
  status: varchar("status", { length: 30 }).notNull().default("ATIVO"),
  maquinaId: integer("maquina_id").references(() => maquinas.id, { onDelete: "set null" }),
  responsavelId: integer("responsavel_id").references(() => usuarios.id, { onDelete: "set null" }),
  observacoes: text("observacoes"),
  anexos: jsonb("anexos").$type<{ url: string; nome: string }[]>().default([]),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Ativo = typeof ativos.$inferSelect
export type NewAtivo = typeof ativos.$inferInsert

export const ativosTiposVistoria = pgTable("ativos_tipos_vistoria", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  categoriaId: integer("categoria_id").references(() => ativoCategorias.id, {
    onDelete: "set null",
  }),
  areaId: integer("area_id")
    .notNull()
    .references(() => procAreas.id, { onDelete: "no action" }),
  procedimento: text("procedimento"),
  checklist: jsonb("checklist").$type<VistoriaItemTemplate[]>().default([]),
  periodicidade: varchar("periodicidade", { length: 20 }).notNull(),
  diasIntervalo: integer("dias_intervalo"),
  baseLegal: varchar("base_legal", { length: 200 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type AtivoTipoVistoria = typeof ativosTiposVistoria.$inferSelect
export type NewAtivoTipoVistoria = typeof ativosTiposVistoria.$inferInsert

export const ativosPlanosVistoria = pgTable(
  "ativos_planos_vistoria",
  {
    id: serial("id").primaryKey(),
    ativoId: integer("ativo_id")
      .notNull()
      .references(() => ativos.id, { onDelete: "cascade" }),
    tipoVistoriaId: integer("tipo_vistoria_id")
      .notNull()
      .references(() => ativosTiposVistoria.id, { onDelete: "cascade" }),
    responsavelId: integer("responsavel_id").references(() => usuarios.id, {
      onDelete: "set null",
    }),
    diasIntervalo: integer("dias_intervalo"),
    proximaData: date("proxima_data"),
    ativo: boolean("ativo").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t: any) => [uniqueIndex("ativos_planos_ativo_tipo_unique").on(t.ativoId, t.tipoVistoriaId)]
)

export type AtivoPlanoVistoria = typeof ativosPlanosVistoria.$inferSelect
export type NewAtivoPlanoVistoria = typeof ativosPlanosVistoria.$inferInsert

export const ativosVistorias = pgTable("ativos_vistorias", {
  id: serial("id").primaryKey(),
  planoId: integer("plano_id").references(() => ativosPlanosVistoria.id, { onDelete: "set null" }),
  ativoId: integer("ativo_id")
    .notNull()
    .references(() => ativos.id, { onDelete: "cascade" }),
  tipoVistoriaId: integer("tipo_vistoria_id")
    .notNull()
    .references(() => ativosTiposVistoria.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("PENDENTE"),
  dataProgramada: date("data_programada").notNull(),
  dataRealizada: date("data_realizada"),
  executadoPorId: integer("executado_por_id").references(() => usuarios.id, {
    onDelete: "set null",
  }),
  resultado: varchar("resultado", { length: 20 }),
  checklistResposta: jsonb("checklist_resposta").$type<VistoriaResposta[]>().default([]),
  observacoes: text("observacoes"),
  custo: numeric("custo", { precision: 12, scale: 2 }),
  anexos: jsonb("anexos").$type<{ url: string; nome: string }[]>().default([]),
  createdById: integer("created_by_id").references(() => usuarios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type AtivoVistoria = typeof ativosVistorias.$inferSelect
export type NewAtivoVistoria = typeof ativosVistorias.$inferInsert

export const ativosReformas = pgTable(
  "ativos_reformas",
  {
    id: serial("id").primaryKey(),
    ativoId: integer("ativo_id")
      .notNull()
      .references(() => ativos.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    valor: numeric("valor", { precision: 12, scale: 2 }),
    extensaoVidaUtilAnos: integer("extensao_vida_util_anos"),
    motivo: varchar("motivo", { length: 200 }),
    descricao: text("descricao"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t: any) => [index("idx_ativos_reformas_ativo_id").on(t.ativoId)]
)

export type AtivoReforma = typeof ativosReformas.$inferSelect
export type NewAtivoReforma = typeof ativosReformas.$inferInsert
