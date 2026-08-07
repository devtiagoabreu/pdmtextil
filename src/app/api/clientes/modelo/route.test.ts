import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/clientes/modelo",
  GET,
  csvHeader: ["nome", "cnpj", "razaoSocial", "email", "telefone", "contato", "endereco", "cidade", "uf", "idIntegracao"],
  filename: "clientes_modelo.csv",
  modelo: "Clientes",
})
