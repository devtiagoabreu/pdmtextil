import { pgTable, serial, varchar, integer, timestamp, text, jsonb } from "drizzle-orm/pg-core"
import { solicitacoes } from "./solicitacoes"
import { usuarios } from "./usuarios"

export const anexos = pgTable("anexos", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id").references(() => solicitacoes.id).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  url: text("url").notNull(),
  metadados: jsonb("metadados").default({}),
  nomeArquivo: varchar("nome_arquivo", { length: 255 }),
  tamanho: integer("tamanho"),
  mimeType: varchar("mime_type", { length: 100 }),
  criadoPor: integer("criado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})
