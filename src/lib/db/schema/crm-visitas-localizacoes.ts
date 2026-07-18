import { pgTable, serial, integer, varchar, text, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { crmVisitas } from "./crm-visitas"
import { usuarios } from "./usuarios"

export const crmVisitasLocalizacoes = pgTable("crm_visitas_localizacoes", {
  id: serial("id").primaryKey(),
  visitaId: integer("visita_id").notNull().references(() => crmVisitas.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  endereco: varchar("endereco", { length: 500 }),
  observacao: text("observacao"),
  fotoUrl: varchar("foto_url", { length: 500 }),
  tipo: varchar("tipo", { length: 20 }).notNull().default("LOCAL"),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmVisitaLocalizacao = typeof crmVisitasLocalizacoes.$inferSelect
export type NewCrmVisitaLocalizacao = typeof crmVisitasLocalizacoes.$inferInsert
