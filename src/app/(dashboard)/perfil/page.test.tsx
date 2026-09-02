// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import PerfilPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "1", name: "Tiago Teste", email: "tiago@pdtextil.com.br", role: "ADMIN" } },
    status: "authenticated",
  }),
  signOut: vi.fn(),
}))

function setup() {
  navMock.setPathname("/perfil")
  const fetchMock = createFetchMock(({ method, url, body }) => {
    if (method === "PUT" && url === "/api/perfil/senha") return { json: { ok: true }, body }
    return { json: null }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("PerfilPage", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("renderiza heading, dados do usuário e o formulário de senha", async () => {
    setup()
    renderPage(<PerfilPage />)

    expect(screen.getByRole("heading", { name: "Meu Perfil" })).toBeInTheDocument()
    expect(screen.getByText("Tiago Teste")).toBeInTheDocument()
    expect(screen.getByText("tiago@pdtextil.com.br")).toBeInTheDocument()
    expect(await screen.findByText("ADMIN")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Salvar Senha" })).toBeInTheDocument()
  })

  it("altera a senha via PUT /api/perfil/senha", async () => {
    const fetchMock = setup()
    renderPage(<PerfilPage />)

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), {
      target: { value: "novaSenha123" },
    })
    fireEvent.change(screen.getByPlaceholderText("Digite a senha novamente"), {
      target: { value: "novaSenha123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Senha" }))

    const call = findCall(fetchMock.calls, "/api/perfil/senha", "PUT")
    expect(call).toBeDefined()
    expect(call?.body).toEqual({ password: "novaSenha123" })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Senha alterada com sucesso!"))
  })

  it("valida quando as senhas não conferem", async () => {
    setup()
    renderPage(<PerfilPage />)

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), {
      target: { value: "senha123" },
    })
    fireEvent.change(screen.getByPlaceholderText("Digite a senha novamente"), {
      target: { value: "outra123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Senha" }))

    expect(toastMock.error).toHaveBeenCalledWith("As senhas não conferem")
  })
})
