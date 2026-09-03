// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import AiChavesPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const chaves = [
  { id: 1, provedor: "groq", nome: "Groq Principal", chaveApi: "gsk_abc", urlBase: "https://api.groq.com/openai/v1", modelo: "qwen/qwen3.8-27b", ordem: 1, ativo: true, failCount: 0, ultimaFalha: null },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/ai-chaves") return { json: chaves }
    if (method === "POST" && url === "/api/admin/ai-chaves") return { status: 201, json: { id: 2 } }
    if (method === "PUT" && url === "/api/admin/ai-chaves") return { status: 200, json: { success: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AiChavesPage", () => {
  it("renderiza heading e lista de chaves", async () => {
    setup()
    renderPage(<AiChavesPage />)

    expect(await screen.findByRole("heading", { name: "Chaves de IA" })).toBeInTheDocument()
    expect(screen.getByText("Groq Principal")).toBeInTheDocument()
    expect(screen.getByText("gsk_abc")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há chaves", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/ai-chaves") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<AiChavesPage />)

    expect(await screen.findByText("Nenhuma chave de IA cadastrada")).toBeInTheDocument()
  })

  it("adiciona chave via POST", async () => {
    const fetchMock = setup()
    renderPage(<AiChavesPage />)
    await screen.findByText("Groq Principal")

    fireEvent.click(screen.getByRole("button", { name: "Nova Chave de IA" }))
    fireEvent.change(screen.getByPlaceholderText("Ex: Groq Principal"), { target: { value: "Groq Backup" } })
    fireEvent.change(screen.getByPlaceholderText("sk-..."), { target: { value: "sk_teste" } })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/ai-chaves", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("Groq Backup")
      expect(call?.body?.chaveApi).toBe("sk_teste")
      expect(call?.body?.provedor).toBe("groq")
      expect(call?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Chave adicionada!"))
  })

  it("edita chave mantendo a chave da API atual (sem redigitar)", async () => {
    const fetchMock = setup()
    renderPage(<AiChavesPage />)
    await screen.findByText("Groq Principal")

    fireEvent.click(screen.getByLabelText("Editar"))
    fireEvent.change(screen.getByPlaceholderText("Ex: Groq Principal"), { target: { value: "Groq Renomeado" } })
    fireEvent.change(screen.getByDisplayValue("qwen/qwen3.8-27b"), { target: { value: "gemini-3.6-flash" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/ai-chaves", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.id).toBe(1)
      expect(call?.body?.nome).toBe("Groq Renomeado")
      expect(call?.body?.modelo).toBe("gemini-3.6-flash")
      expect(call?.body?.chaveApi).toBe("")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Chave atualizada!"))
  })
})
