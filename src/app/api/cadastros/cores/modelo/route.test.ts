import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/cadastros/cores/modelo",
  GET,
  csvHeader: ["codigo", "nome", "pantone", "familia", "idIntegracao", "ativo"],
  filename: "cores_modelo.csv",
  modelo: "Cores Solidas",
})
