import { pgTable, serial, integer, varchar, text, timestamp, numeric, uniqueIndex } from "drizzle-orm/pg-core"

export const romaneios = pgTable("romaneios", {
  id: serial("id").primaryKey(),
  romaneio: integer("romaneio").notNull().unique(),
  pedido: integer("pedido"),
  cnpj: varchar("cnpj", { length: 18 }),
  nomeCliente: varchar("nome_cliente", { length: 200 }),
  fantasia: varchar("fantasia", { length: 200 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  nomeRepresentante: varchar("nome_representante", { length: 200 }),
  nomeRegiao: varchar("nome_regiao", { length: 100 }),
  situacao: varchar("situacao", { length: 30 }),
  emissao: timestamp("emissao"),
  entrega: timestamp("entrega"),
  chegada: timestamp("chegada"),
  linha: varchar("linha", { length: 100 }),
  grupo: varchar("grupo", { length: 100 }),
  sub: varchar("sub", { length: 100 }),
  totalPecas: integer("total_pecas").default(0),
  totalMetragem: numeric("total_metragem", { precision: 12, scale: 2 }),
  totalPesoBruto: numeric("total_peso_bruto", { precision: 12, scale: 4 }),
  totalPesoLiquido: numeric("total_peso_liquido", { precision: 12, scale: 4 }),
  idIntegracao: varchar("id_integracao", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const romaneioPecas = pgTable("romaneio_pecas", {
  id: serial("id").primaryKey(),
  romaneioId: integer("romaneio_id").references(() => romaneios.id, { onDelete: "cascade" }).notNull(),
  codigoRolo: integer("codigo_rolo").notNull(),
  produto: varchar("produto", { length: 100 }),
  narrativa: text("narrativa"),
  lote: integer("lote"),
  loteProduto: varchar("lote_produto", { length: 50 }),
  quantidade: numeric("quantidade", { precision: 12, scale: 2 }),
  pesoBruto: numeric("peso_bruto", { precision: 12, scale: 4 }),
  pesoLiquido: numeric("peso_liquido", { precision: 12, scale: 4 }),
  dataEntrada: timestamp("data_entrada"),
  op: integer("op"),
  nomeOperador: varchar("nome_operador", { length: 100 }),
  largura: numeric("largura", { precision: 8, scale: 2 }),
  gramatura: numeric("gramatura", { precision: 8, scale: 2 }),
  enderecoRolo: varchar("endereco_rolo", { length: 50 }),
  cor: varchar("cor", { length: 100 }),
  vendido: numeric("vendido", { precision: 12, scale: 2 }),
  saldo: numeric("saldo", { precision: 12, scale: 2 }),
  unitario: numeric("unitario", { precision: 12, scale: 4 }),
  valorVendido: numeric("valor_vendido", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Romaneio = typeof romaneios.$inferSelect
export type NewRomaneio = typeof romaneios.$inferInsert
export type RomaneioPeca = typeof romaneioPecas.$inferSelect
export type NewRomaneioPeca = typeof romaneioPecas.$inferInsert
