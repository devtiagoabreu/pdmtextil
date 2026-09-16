import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { crmPessoas } from "./crm-pessoas"
import { crmContatos } from "./crm-contatos"

export const crmWhatsappMensagens = pgTable(
  "crm_whatsapp_mensagens",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id").references(() => crmPessoas.id),
    contatoId: integer("contato_id").references(() => crmContatos.id),
    mensagem: text("mensagem").notNull(),
    tipo: varchar("tipo", { length: 10 }).notNull().default("RECEBIDA"),
    status: varchar("status", { length: 10 }).notNull().default("RECEBIDA"),
    lida: boolean("lida").default(false),
    externalId: varchar("external_id", { length: 255 }),
    remoteJid: varchar("remote_jid", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t: any) => [uniqueIndex("crm_whatsapp_mensagens_external_id_unique").on(t.externalId)]
)

export type CrmWhatsappMensagem = typeof crmWhatsappMensagens.$inferSelect
export type NewCrmWhatsappMensagem = typeof crmWhatsappMensagens.$inferInsert
