import { pgTable, serial, integer, varchar, text, timestamp, foreignKey } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("LIVRE"), // LIVRE | VINCULADO
  titulo: varchar("titulo", { length: 200 }).notNull(),
  entidadeTipo: varchar("entidade_tipo", { length: 50 }),
  entidadeId: integer("entidade_id"),
  criadoPor: integer("criado_por").references(() => usuarios.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const chatMensagens = pgTable("chat_mensagens", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  remetenteId: integer("remetente_id").references(() => usuarios.id).notNull(),
  mensagem: text("mensagem").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const chatParticipantes = pgTable("chat_participantes", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "cascade" }).notNull(),
  adicionadoEm: timestamp("adicionado_em").defaultNow(),
  ultimaMensagemLidaId: integer("ultima_mensagem_lida_id"),
})

export const chatLeituras = pgTable("chat_leituras", {
  id: serial("id").primaryKey(),
  mensagemId: integer("mensagem_id").references(() => chatMensagens.id, { onDelete: "cascade" }).notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id, { onDelete: "cascade" }).notNull(),
  lidaEm: timestamp("lida_em").defaultNow(),
})

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type ChatMensagem = typeof chatMensagens.$inferSelect
export type NewChatMensagem = typeof chatMensagens.$inferInsert
export type ChatParticipante = typeof chatParticipantes.$inferSelect
export type ChatLeitura = typeof chatLeituras.$inferSelect
