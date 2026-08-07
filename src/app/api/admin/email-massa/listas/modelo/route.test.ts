import { vi } from "vitest"
import { GET } from "./route"
import { modeloRouteSpec } from "@/test/modelo-route-spec"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))

modeloRouteSpec({
  title: "GET /api/admin/email-massa/listas/modelo",
  GET,
  csvHeader: ["nome", "email"],
  filename: "contatos_email_modelo.csv",
  modelo: "Contatos de Email",
  roles: ["ADMIN", "SUDO", "CRM"],
})
