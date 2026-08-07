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

function setup(emailConfig: unknown = { config: null }) {
  navMock.setPathname("/perfil")
  const fetchMock = createFetchMock(({ method, url, body }) => {
    if (method === "GET" && url === "/api/user/email-config") return { json: emailConfig }
    if (method === "PUT" && url === "/api/user/email-config") return { json: { ok: true } }
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

  it("renderiza heading, dados do usuário e o formulário de email vazio", async () => {
    setup()
    renderPage(<PerfilPage />)

    expect(screen.getByRole("heading", { name: "Meu Perfil" })).toBeInTheDocument()
    expect(screen.getByText("Tiago Teste")).toBeInTheDocument()
    expect(screen.getByText("tiago@pdtextil.com.br")).toBeInTheDocument()
    expect(await screen.findByText("ADMIN")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Salvar" })).toBeInTheDocument()
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
    expect(call.body).toEqual({ password: "novaSenha123" })
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

  it("salva a configuração de email via PUT /api/user/email-config", async () => {
    const fetchMock = setup()
    renderPage(<PerfilPage />)

    const emailInput = await screen.findByPlaceholderText("seuemail@gmail.com")
    fireEvent.change(emailInput, {
      target: { value: "tiago@gmail.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("senha de app do Gmail"), {
      target: { value: "appPassword123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    const call = findCall(fetchMock.calls, "/api/user/email-config", "PUT")
    expect(call).toBeDefined()
    expect(call.body).toEqual({ email: "tiago@gmail.com", senha_app: "appPassword123" })
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Configuração de email salva com sucesso!")
    )
  })

  it("exibe a configuração de email já cadastrada", async () => {
    setup({ config: { email: "tiago@gmail.com", senhaApp: "abc123" } })
    renderPage(<PerfilPage />)

    expect(await screen.findByText("Você já possui uma configuração de email cadastrada.")).toBeInTheDocument()
    expect(screen.getByDisplayValue("tiago@gmail.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument()
  })
})
