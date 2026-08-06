// @vitest-environment jsdom
import CorFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "CorFormPage",
  component: <CorFormPage />,
  apiBase: "cores",
  listHref: "/cadastros/cores",
  headingNew: "Nova Cor Sólida",
  headingEdit: "Editar Cor",
  validationToast: "Código e Nome são obrigatórios",
  successToastNew: "Cor criada!",
  successToastEdit: "Cor atualizada!",
  editId: 3,
  editData: {
    id: 3,
    codigo: "0001A1",
    nome: "Azul Marinho",
    pantone: "2955C",
    familia: "AZUL",
    ativo: true,
    idIntegracao: "ERP-C1",
  },
  editDisplayValue: "Azul Marinho",
  createFields: [
    { placeholder: "0001A1", value: "0002B2" },
    { placeholder: "Azul Marinho", value: "Vermelho Rubi" },
  ],
  createBodyAssert: (body) => {
    expect(body.codigo).toBe("0002B2")
    expect(body.nome).toBe("Vermelho Rubi")
    expect(body.ativo).toBe(true)
  },
})
