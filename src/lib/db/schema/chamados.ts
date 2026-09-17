import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"
import { procAreas } from "./processos"
import { ativos } from "./ativos"
import { procProcessos } from "./processos"

export const CHAMADO_STATUS = [
  "ABERTO",
  "EM_ANDAMENTO",
  "AGUARDANDO",
  "RESOLVIDO",
  "FECHADO",
  "REABERTO",
  "CANCELADO",
] as const
export type ChamadoStatus = (typeof CHAMADO_STATUS)[number]

export const CHAMADO_CATEGORIAS = [
  "INCIDENTE",
  "SOLICITACAO",
  "MANUTENCAO_CORRETIVA",
  "MANUTENCAO_PREVENTIVA",
  "OUTRO",
] as const
export type ChamadoCategoria = (typeof CHAMADO_CATEGORIAS)[number]

export const CHAMADO_PRIORIDADES = ["URGENTE", "ALTA", "MEDIA", "BAIXA"] as const
export type ChamadoPrioridade = (typeof CHAMADO_PRIORIDADES)[number]

export const CHAMADO_MSG_TIPOS = ["RESPOSTA", "NOTA", "SISTEMA"] as const
export type ChamadoMsgTipo = (typeof CHAMADO_MSG_TIPOS)[number]

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    descricao: text("descricao").notNull(),
    categoria: varchar("categoria", { length: 30 }).notNull().default("SOLICITACAO"),
    status: varchar("status", { length: 30 }).notNull().default("ABERTO"),
    prioridade: varchar("prioridade", { length: 20 }).notNull().default("MEDIA"),
    areaId: integer("area_id")
      .notNull()
      .references(() => procAreas.id),
    solicitanteId: integer("solicitante_id")
      .notNull()
      .references(() => usuarios.id),
    responsavelId: integer("responsavel_id").references(() => usuarios.id),
    ativoId: integer("ativo_id").references(() => ativos.id, { onDelete: "set null" }),
    processoId: integer("processo_id").references(() => procProcessos.id, {
      onDelete: "set null",
    }),
    slaPrimeiraRespostaPrazo: timestamp("sla_primeira_resposta_prazo"),
    slaResolucaoPrazo: timestamp("sla_resolucao_prazo"),
    primeiraRespostaEm: timestamp("primeira_resposta_em"),
    resolvidoEm: timestamp("resolvido_em"),
    fechadoEm: timestamp("fechado_em"),
    anexos: jsonb("anexos")
      .$type<{ url: string; nome: string }[]>()
      .default([]),
    ativo: boolean("ativo").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t: any) => [
    index("idx_tickets_status").on(t.status),
    index("idx_tickets_prioridade").on(t.prioridade),
    index("idx_tickets_area_id").on(t.areaId),
    index("idx_tickets_solicitante_id").on(t.solicitanteId),
    index("idx_tickets_responsavel_id").on(t.responsavelId),
    index("idx_tickets_created_at").on(t.createdAt),
  ]
)

export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert

export const ticketMensagens = pgTable(
  "ticket_mensagens",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    autorId: integer("autor_id").references(() => usuarios.id, {
      onDelete: "set null",
    }),
    tipo: varchar("tipo", { length: 20 }).notNull().default("RESPOSTA"),
    mensagem: text("mensagem").notNull(),
    anexos: jsonb("anexos")
      .$type<{ url: string; nome: string }[]>()
      .default([]),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t: any) => [
    index("idx_ticket_mensagens_ticket_id").on(t.ticketId),
    index("idx_ticket_mensagens_created_at").on(t.createdAt),
  ]
)

export type TicketMensagem = typeof ticketMensagens.$inferSelect
export type NewTicketMensagem = typeof ticketMensagens.$inferInsert
