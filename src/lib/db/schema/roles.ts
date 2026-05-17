import { pgTable, serial, varchar, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core"

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").default({}),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
