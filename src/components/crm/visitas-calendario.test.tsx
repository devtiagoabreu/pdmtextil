// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, screen, within } from "@testing-library/react"
import { renderPage, navMock } from "@/test/harness"
import VisitasCalendario from "./visitas-calendario"

const hoje = new Date()
const mes = String(hoje.getMonth() + 1).padStart(2, "0")
const ano = hoje.getFullYear()

const visitas = [
  {
    id: 1,
    dataVisita: `${ano}-${mes}-15`,
    hora: "09:00",
    tipo: "PRESENCIAL",
    status: "REALIZADA",
    empresaNome: "Tecelagem Beta",
    clienteNome: null,
    nomeAvulso: null,
    empresaId: 5,
    clienteId: null,
    oportunidadeTitulo: "Pedido A",
    criadoPorNome: "Maria",
    endereco: "Rua X, 100",
    numero: null,
    complemento: null,
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "SP",
  },
]

describe("VisitasCalendario", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("abre o dialog do dia ao clicar num dia com visita", async () => {
    renderPage(<VisitasCalendario visitas={visitas} />)

    const dayButton = screen.getByRole("button", { name: /15.*Tecelagem Beta|1 visita/i })
    fireEvent.click(dayButton)

    const dialog = await screen.findByRole("dialog", { name: /15 de/i })
    expect(within(dialog).getByText("Tecelagem Beta")).toBeInTheDocument()
    expect(within(dialog).getByText(/Presencial/)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "Abrir no Google Maps" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Fechar" })).toBeInTheDocument()
  })

  it("navega para a visita ao clicar no item do dialog", async () => {
    renderPage(<VisitasCalendario visitas={visitas} />)

    const dayButton = screen.getByRole("button", { name: /1 visita/i })
    fireEvent.click(dayButton)

    const dialog = await screen.findByRole("dialog", { name: /15 de/i })
    fireEvent.click(within(dialog).getByText("Tecelagem Beta"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/visitas/1")
  })

  it("fecha o dialog ao clicar em Fechar", async () => {
    renderPage(<VisitasCalendario visitas={visitas} />)

    const dayButton = screen.getByRole("button", { name: /1 visita/i })
    fireEvent.click(dayButton)

    const dialog = await screen.findByRole("dialog", { name: /15 de/i })
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})