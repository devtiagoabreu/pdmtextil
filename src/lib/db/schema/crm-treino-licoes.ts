import { pgTable, serial, integer, varchar, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core"
import { crmTreinoModulos } from "./crm-treino-modulos"

export const crmTreinoLicoes = pgTable("crm_treino_licoes", {
  id: serial("id").primaryKey(),
  moduloId: integer("modulo_id").notNull().references(() => crmTreinoModulos.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  conteudoMd: text("conteudo_md").notNull().default(""),
  preRequisitos: text("pre_requisitos"),
  linksPop: jsonb("links_pop").$type<{ label: string; url: string }[]>().default([]),
  linksVideo: jsonb("links_video").$type<{ label: string; url: string }[]>().default([]),
  pathnameRelacionado: varchar("pathname_relacionado", { length: 255 }),
  ordem: integer("ordem").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmTreinoLicao = typeof crmTreinoLicoes.$inferSelect
export type NewCrmTreinoLicao = typeof crmTreinoLicoes.$inferInsert
