import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/cadastros/fios/modelo",
  GET,
  csvHeader: ["codigoFio", "nome", "nomeComercial", "composicao", "titulo", "torcao", "resistencia", "alongamento", "idIntegracao", "ativo"],
  filename: "fios_modelo.csv",
  modelo: "Fios",
})
