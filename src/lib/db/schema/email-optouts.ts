import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core"

export const emailOptouts = pgTable("email_optouts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  criadoEm: timestamp("criado_em").defaultNow(),
})

export type EmailOptout = typeof emailOptouts.$inferSelect
export type NewEmailOptout = typeof emailOptouts.$inferInsert
