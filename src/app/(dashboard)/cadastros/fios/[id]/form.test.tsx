// @vitest-environment jsdom
import FioFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "FioFormPage",
  component: <FioFormPage />,
  apiBase: "fios",
  listHref: "/cadastros/fios",
  headingNew: "Novo Fio",
  headingEdit: "Editar Fio",
  validationToast: "Código e Nome são obrigatórios",
  successToastNew: "Fio criado!",
  successToastEdit: "Fio atualizado!",
  editId: 7,
  editData: {
    id: 7,
    codigoFio: "AL20",
    codigoCompleto: "7.AL20.XXX.000001",
    nome: "Fio de Algodão",
    ativo: true,
  },
  editDisplayValue: "Fio de Algodão",
  createFields: [
    { placeholder: "AL20", value: "AL30" },
    { placeholder: "Fio de Algodão", value: "Fio de Poliéster" },
  ],
  handler: ({ method, url }) => {
    if (method === "GET" && url === "/api/cadastros/fornecedores") return { json: [] }
    if (method === "GET" && url === "/api/cadastros/fios/7/fornecedores") return { json: [] }
    return { status: 404, json: { error: "Rota não mockada" } }
  },
  createBodyAssert: (body) => {
    expect(body.codigoFio).toBe("AL30")
    expect(body.codigoCompleto).toBe("7.AL30.XXX.000001")
    expect(body.ativo).toBe(true)
  },
})
