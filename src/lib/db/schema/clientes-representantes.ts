import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"
import { representantes } from "./representantes"

export const clientesRepresentantes = pgTable("clientes_representantes", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  representanteId: integer("representante_id").notNull().references(() => representantes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type ClienteRepresentante = typeof clientesRepresentantes.$inferSelect
export type NewClienteRepresentante = typeof clientesRepresentantes.$inferInsert
