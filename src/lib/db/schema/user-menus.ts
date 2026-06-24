import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { usuarios } from "./usuarios"

export const userMenus = pgTable("user_menus", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 100 }).notNull(),
  icone: varchar("icone", { length: 50 }),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type UserMenu = typeof userMenus.$inferSelect
export type NewUserMenu = typeof userMenus.$inferInsert

export const userMenuItens = pgTable("user_menu_itens", {
  id: serial("id").primaryKey(),
  userMenuId: integer("user_menu_id").notNull().references(() => userMenus.id, { onDelete: "cascade" }),
  titulo: varchar("titulo", { length: 100 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  ordem: integer("ordem").notNull().default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type UserMenuItem = typeof userMenuItens.$inferSelect
export type NewUserMenuItem = typeof userMenuItens.$inferInsert
