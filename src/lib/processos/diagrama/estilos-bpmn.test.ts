// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  estilosTextoParaCss,
  FONT_FAMILIAS,
  FONT_TAMANHOS,
  lerEstilosTexto,
  limparEstilosTexto,
  salvarEstilosTexto,
} from "./estilos-bpmn"

describe("lerEstilosTexto", () => {
  it("retorna vazio para di sem atributos", () => {
    expect(lerEstilosTexto(null)).toEqual({})
    expect(lerEstilosTexto(undefined)).toEqual({})
    expect(lerEstilosTexto({})).toEqual({})
  })

  it("lê os estilos persistidos no di.$attrs", () => {
    const di = {
      $attrs: {
        "pdm:textFill": "#ff0000",
        "pdm:fontFamily": "Arial",
        "pdm:fontSize": 14,
        "pdm:fontWeight": "bold",
        "pdm:fontStyle": "italic",
      },
    }
    expect(lerEstilosTexto(di)).toEqual({
      textFill: "#ff0000",
      fontFamily: "Arial",
      fontSize: 14,
      fontWeight: "bold",
      fontStyle: "italic",
    })
  })

  it("ignora valores de tipo incorreto", () => {
    const di = { $attrs: { "pdm:fontSize": "14", "pdm:fontFamily": 12 } }
    expect(lerEstilosTexto(di)).toEqual({})
  })
})

describe("salvarEstilosTexto", () => {
  it("grava os estilos no di.$attrs e reporta mudança", () => {
    const di: Record<string, unknown> = {}
    const mudou = salvarEstilosTexto(di, { textFill: "#00ff00", fontSize: 16 })
    expect(mudou).toBe(true)
    expect((di as { $attrs?: Record<string, unknown> }).$attrs?.["pdm:textFill"]).toBe("#00ff00")
    expect((di as { $attrs?: Record<string, unknown> }).$attrs?.["pdm:fontSize"]).toBe(16)
  })

  it("grava apenas as chaves definidas da configuração", () => {
    const di: Record<string, unknown> = {}
    salvarEstilosTexto(di, { fontFamily: "Verdana" })
    const attrs = (di as { $attrs?: Record<string, unknown> }).$attrs as Record<string, unknown>
    expect(attrs["pdm:fontFamily"]).toBe("Verdana")
    expect(attrs["pdm:textFill"]).toBeUndefined()
  })

  it("não cria atributos para di inválido", () => {
    expect(salvarEstilosTexto(null, { textFill: "#fff" })).toBe(false)
  })
})

describe("limparEstilosTexto", () => {
  it("remove apenas as chaves do namespace pdm", () => {
    const di: Record<string, unknown> = {
      $attrs: { "pdm:textFill": "#fff", "pdm:fontSize": 14, "bpmndi:labeled": "true" },
    }
    limparEstilosTexto(di)
    expect((di as { $attrs?: Record<string, unknown> }).$attrs).toEqual({ "bpmndi:labeled": "true" })
  })

  it("nada a fazer sem $attrs", () => {
    expect(() => limparEstilosTexto(null)).not.toThrow()
  })
})

describe("estilosTextoParaCss", () => {
  it("converte estilos em valores CSS", () => {
    expect(
      estilosTextoParaCss({ textFill: "#123", fontFamily: "Arial", fontSize: 14, fontWeight: "bold", fontStyle: "italic" })
    ).toEqual({
      fill: "#123",
      fontFamily: "Arial",
      fontSize: "14px",
      fontWeight: "bold",
      fontStyle: "italic",
    })
  })

  it("omite propriedades ausentes", () => {
    expect(estilosTextoParaCss({})).toEqual({})
  })
})

describe("constantes de fonte", () => {
  it("expõe famílias e tamanhos comuns", () => {
    expect(FONT_FAMILIAS).toContain("Arial")
    expect(FONT_TAMANHOS).toContain(14)
  })
})