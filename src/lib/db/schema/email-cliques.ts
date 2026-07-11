import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core"
import { emailEnviados } from "./email-enviados"

export const emailCliques = pgTable("email_cliques", {
  id: serial("id").primaryKey(),
  envioId: integer("envio_id").references(() => emailEnviados.id, { onDelete: "cascade" }),
  urlOriginal: text("url_original").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow(),
})

export type EmailClique = typeof emailCliques.$inferSelect
export type NewEmailClique = typeof emailCliques.$inferInsert
