import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/cadastros/estampas/modelo",
  GET,
  csvHeader: ["codigoDesenho", "variante", "nome", "tipo", "imagemUrl", "idIntegracao", "ativo"],
  filename: "estampas_modelo.csv",
  modelo: "Estampas",
})
