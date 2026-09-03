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

function setup(getConfig: any = null) {
  navMock.setPathname("/perfil")
  const fetchMock = createFetchMock(({ method, url, body }) => {
    if (method === "PUT" && url === "/api/perfil/senha") return { json: { ok: true }, body }
    if (method === "GET" && url === "/api/user/email-config") return { json: { config: getConfig } }
    if (method === "PUT" && url === "/api/user/email-config") return { json: { success: true }, body }
    if (method === "POST" && url === "/api/user/email-config") return { json: { success: true, message: "Conexão SMTP realizada com sucesso" }, body }
    if (method === "DELETE" && url === "/api/user/email-config") return { json: { success: true } }
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

  it("exibe o card de email de envio em massa com a configuração existente", async () => {
    setup({ email: "remetente@gmail.com", ativo: true, limiteDiario: 3000, hasPassword: true })
    renderPage(<PerfilPage />)

    expect(await screen.findByText("Email de Envio em Massa")).toBeInTheDocument()
    expect(await screen.findByDisplayValue("remetente@gmail.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("3000")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Testar conexão" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument()
  })

  it("mostra 'Não configurado' quando não há configuração", async () => {
    setup(null)
    renderPage(<PerfilPage />)

    expect(await screen.findByText("Não configurado")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Testar conexão" })).toBeInTheDocument()
  })

  it("salva o email de envio via PUT /api/user/email-config", async () => {
    const fetchMock = setup(null)
    renderPage(<PerfilPage />)

    fireEvent.change(await screen.findByPlaceholderText("seuemail@gmail.com"), {
      target: { value: "remetente@gmail.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Senha de app do Gmail"), {
      target: { value: "senhaApp123" },
    })
    fireEvent.change(screen.getByDisplayValue("1500"), {
      target: { value: "2500" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    const call = findCall(fetchMock.calls, "/api/user/email-config", "PUT")
    expect(call).toBeDefined()
    expect(call?.body).toEqual({
      email: "remetente@gmail.com",
      senha_app: "senhaApp123",
      limite_diario: 2500,
      ativo: true,
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração de email salva!"))
  })

  it("valida senha de app obrigatória ao criar configuração", async () => {
    setup(null)
    renderPage(<PerfilPage />)

    fireEvent.change(await screen.findByPlaceholderText("seuemail@gmail.com"), {
      target: { value: "remetente@gmail.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(toastMock.error).toHaveBeenCalledWith("Informe a senha de app para criar a configuração")
  })

  it("remove a configuração via DELETE /api/user/email-config", async () => {
    const fetchMock = setup({ email: "remetente@gmail.com", ativo: true, limiteDiario: 1500, hasPassword: true })
    renderPage(<PerfilPage />)

    const removeBtn = await screen.findByRole("button", { name: "Remover" })
    fireEvent.click(removeBtn)

    const call = findCall(fetchMock.calls, "/api/user/email-config", "DELETE")
    expect(call).toBeDefined()
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração de email removida"))
  })
})
