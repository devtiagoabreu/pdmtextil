import { pgTable, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core"

export const biSheets = pgTable("bi_sheets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  url: text("url").notNull(),
  title: varchar("title", { length: 255 }),
  data: jsonb("data").notNull(),
  loadedAt: timestamp("loaded_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type BiSheetRow = typeof biSheets.$inferSelect
export type NewBiSheetRow = typeof biSheets.$inferInsert
