import { pgTable, serial, integer, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const crmWhatsappDestinatarios = pgTable(
  "crm_whatsapp_destinatarios",
  {
    id: serial("id").primaryKey(),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    tipoPessoa: varchar("tipo_pessoa", { length: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t: any) => [
    uniqueIndex("crm_whatsapp_destinatarios_usuario_tipo_uq").on(t.usuarioId, t.tipoPessoa),
  ]
)

export type CrmWhatsappDestinatario = typeof crmWhatsappDestinatarios.$inferSelect
export type NewCrmWhatsappDestinatario = typeof crmWhatsappDestinatarios.$inferInsert