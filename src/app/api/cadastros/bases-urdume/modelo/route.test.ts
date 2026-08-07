import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/cadastros/bases-urdume/modelo",
  GET,
  csvHeader: ["codigoBase", "codigoCompleto", "nome", "descricao", "densidade", "tratamento", "tensaoUrdume", "largura", "observacoes", "idIntegracao", "ativo"],
  filename: "bases_urdume_modelo.csv",
  modelo: "Bases de Urdume",
})
