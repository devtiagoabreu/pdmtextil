import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ConfirmModal } from "./confirm-modal"

function setup(props = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const defaultProps = {
    open: true,
    title: "Excluir registro?",
    message: "Esta ação não pode ser desfeita.",
    onConfirm,
    onCancel,
  }
  return { onConfirm, onCancel, ...render(<ConfirmModal {...defaultProps} {...props} />) }
}

describe("ConfirmModal", () => {
  it("renders nothing when closed", () => {
    const { container } = setup({ open: false })
    expect(container.innerHTML).toBe("")
  })

  it("renders title and message when open", () => {
    setup()
    expect(screen.getByText("Excluir registro?")).toBeInTheDocument()
    expect(screen.getByText("Esta ação não pode ser desfeita.")).toBeInTheDocument()
  })

  it("renders subMessage when provided", () => {
    setup({ subMessage: "3 registros serão afetados" })
    expect(screen.getByText("3 registros serão afetados")).toBeInTheDocument()
  })

  it("does not render subMessage when omitted", () => {
    setup()
    expect(screen.queryByText(/registros serão afetados/)).not.toBeInTheDocument()
  })

  it("renders default labels", () => {
    setup()
    expect(screen.getByText("Confirmar")).toBeInTheDocument()
    expect(screen.getByText("Cancelar")).toBeInTheDocument()
  })

  it("renders custom labels", () => {
    setup({ confirmLabel: "Sim", cancelLabel: "Não" })
    expect(screen.getByText("Sim")).toBeInTheDocument()
    expect(screen.getByText("Não")).toBeInTheDocument()
  })

  it("shows loading spinner and 'Aguarde...' when loading", () => {
    setup({ loading: true })
    expect(screen.getByText("Aguarde...")).toBeInTheDocument()
    expect(screen.queryByText("Confirmar")).not.toBeInTheDocument()
  })

  it("disables confirm and cancel buttons when loading", () => {
    setup({ loading: true })
    expect(screen.getByText("Aguarde...")).toBeInTheDocument()
    expect(screen.getByText("Cancelar")).toBeDisabled()
  })

  it("calls onCancel when backdrop is clicked", async () => {
    const { onCancel } = setup()
    const backdrop = screen.getByTestId("backdrop")
    await userEvent.click(backdrop)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("calls onCancel when X button is clicked", async () => {
    const { onCancel } = setup()
    const xButton = screen.getAllByRole("button")[0]
    await userEvent.click(xButton)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("calls onConfirm when confirm button is clicked", async () => {
    const { onConfirm } = setup()
    await userEvent.click(screen.getByText("Confirmar"))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const { onCancel } = setup()
    await userEvent.click(screen.getByText("Cancelar"))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("applies danger styling by default", () => {
    setup()
    const alertIcon = document.querySelector(".text-red-600")
    expect(alertIcon).toBeInTheDocument()
  })

  it("applies warning styling when variant is warning", () => {
    setup({ variant: "warning" })
    const alertIcon = document.querySelector(".text-amber-600")
    expect(alertIcon).toBeInTheDocument()
  })
})
