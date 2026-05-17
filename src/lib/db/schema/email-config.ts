import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const emailConfig = pgTable("email_config", {
  id: serial("id").primaryKey(),
  host: varchar("host", { length: 255 }).notNull().default("smtp.gmail.com"),
  port: integer("port").notNull().default(587),
  user: varchar("user", { length: 255 }).notNull(),
  pass: varchar("pass", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).default("PDM Têxtil"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type EmailConfig = typeof emailConfig.$inferSelect
