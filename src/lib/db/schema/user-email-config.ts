import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const userEmailConfig = pgTable("user_email_config", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  senhaApp: varchar("senha_app", { length: 255 }).notNull(),
  host: varchar("host", { length: 255 }).notNull().default("smtp.gmail.com"),
  port: integer("port").notNull().default(587),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type UserEmailConfig = typeof userEmailConfig.$inferSelect
