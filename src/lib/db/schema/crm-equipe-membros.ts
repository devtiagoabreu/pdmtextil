import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core"
import { crmEquipes } from "./crm-equipes"
import { representantes } from "./representantes"

export const crmEquipeMembros = pgTable("crm_equipe_membros", {
  id: serial("id").primaryKey(),
  equipeId: integer("equipe_id").notNull().references(() => crmEquipes.id, { onDelete: "cascade" }),
  representanteId: integer("representante_id").notNull().references(() => representantes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type CrmEquipeMembro = typeof crmEquipeMembros.$inferSelect
export type NewCrmEquipeMembro = typeof crmEquipeMembros.$inferInsert
