// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { RichTextEditor } from "./rich-text-editor"

function getEditor() {
  return document.querySelector('[contenteditable="true"]') as HTMLElement
}

describe("RichTextEditor", () => {
  it("renderiza o value inicial", () => {
    render(<RichTextEditor value="<p>Relato original</p>" onChange={() => {}} />)
    expect(getEditor().innerHTML).toContain("Relato original")
  })

  it("atualiza o conteúdo quando o value externo muda (ex: seleção de modelo)", () => {
    const onChange = vi.fn()
    const { rerender } = render(<RichTextEditor value="<p>Relato original</p>" onChange={onChange} />)
    const editor = getEditor()
    expect(editor.innerHTML).toContain("Relato original")

    rerender(<RichTextEditor value="<p><strong>Motivo:</strong> Visita tecnica</p>" onChange={onChange} />)

    expect(editor.innerHTML).toContain("Visita tecnica")
    expect(editor.innerHTML).not.toContain("Relato original")
  })

  it("não sobrescreve o conteúdo enquanto o usuário digita", () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="<p>Original</p>" onChange={onChange} />)
    const editor = getEditor()

    editor.innerHTML = "texto digitado"
    fireEvent.input(editor)

    expect(editor.innerHTML).toContain("texto digitado")
    expect(onChange).toHaveBeenCalledWith("texto digitado")
  })

  it("limpa o editor quando o value vira vazio", () => {
    const onChange = vi.fn()
    const { rerender } = render(<RichTextEditor value="<p>Conteudo</p>" onChange={onChange} />)
    const editor = getEditor()
    expect(editor.innerHTML).toContain("Conteudo")

    rerender(<RichTextEditor value="" onChange={onChange} />)

    expect(editor.innerHTML).toBe("")
  })
})
