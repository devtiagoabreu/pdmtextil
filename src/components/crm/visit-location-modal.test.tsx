// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import VisitLocationModal from "./visit-location-modal"
import { createFetchMock, findCall, renderPage } from "@/test/harness"

const localizacoes = [
  {
    id: 1,
    visitaId: 8,
    latitude: -23.55,
    longitude: -46.63,
    endereco: "Av. X, 100",
    observacao: "Estacionamento lateral",
    fotoUrl: null,
    tipo: "CHECKIN",
    criadoPor: 1,
    createdAt: "2026-08-10T12:00:00.000Z",
  },
  {
    id: 2,
    visitaId: 8,
    latitude: -22.9,
    longitude: -43.17,
    endereco: null,
    observacao: null,
    fotoUrl: null,
    tipo: "MANUAL",
    criadoPor: 1,
    createdAt: null,
  },
]

function setup(open = true) {
  const onClose = vi.fn()
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/crm/visitas/8/localizacoes") {
      return { status: 200, json: localizacoes }
    }
    if (method === "POST" && url === "/api/crm/visitas/8/localizacoes") {
      return { status: 201, json: { id: 3 } }
    }
    if (method === "DELETE" && url === "/api/crm/visitas/8/localizacoes?localizacaoId=1") {
      return { status: 200, json: { ok: true } }
    }
    return { status: 404, json: { error: `Rota não mockada: ${method} ${url}` } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  renderPage(<VisitLocationModal visitaId={8} empresaNome="Tecelagem Alpha" open={open} onClose={onClose} />)
  return { onClose, fetchMock }
}

describe("VisitLocationModal", () => {
  it("abre o dialog com título acessível e lista as localizações", async () => {
    setup()
    const dialog = await screen.findByRole("dialog", { name: "Localizações da Visita" })
    expect(await screen.findByText("-23.550000, -46.630000")).toBeInTheDocument()
    expect(screen.getByText("Av. X, 100")).toBeInTheDocument()
    expect(screen.getByText(/Estacionamento lateral/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument()
    expect(within(dialog).getByText("Tecelagem Alpha")).toBeInTheDocument()
  })

  it("associa o label de Observação ao input", async () => {
    setup()
    await screen.findByText("-23.550000, -46.630000")
    expect(screen.getByLabelText("Observação (opcional)")).toBeInTheDocument()
  })

  it("exclui uma localização confirmando e envia DELETE", async () => {
    const { fetchMock } = setup()
    await screen.findByText("-23.550000, -46.630000")

    vi.spyOn(window, "confirm").mockReturnValue(true)
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir localização" })[0])

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/crm/visitas/8/localizacoes?localizacaoId=1", "DELETE")).toBeTruthy()
    })
  })

  it("fecha ao clicar no botão Fechar", async () => {
    const { onClose } = setup()
    const dialog = await screen.findByRole("dialog", { name: "Localizações da Visita" })
    await screen.findByText("-23.550000, -46.630000")
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})