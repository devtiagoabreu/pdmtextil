// @vitest-environment jsdom
import BaseUrdumeFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "BaseUrdumeFormPage",
  component: <BaseUrdumeFormPage />,
  apiBase: "bases-urdume",
  listHref: "/cadastros/bases-urdume",
  headingNew: "Nova Base de Urdume",
  headingEdit: "Editar Base de Urdume",
  validationToast: "Código, Código Completo e Nome são obrigatórios",
  successToastNew: "Base criada!",
  successToastEdit: "Base atualizada!",
  editId: 4,
  editData: {
    id: 4,
    codigoBase: "UR001",
    codigoCompleto: "4.UR001.CRU.000001",
    nome: "Base Algodão 30/1",
    ativo: true,
    fiosLista: [],
  },
  editDisplayValue: "Base Algodão 30/1",
  createFields: [
    { placeholder: "UR001", value: "UR002" },
    { placeholder: "4.UR001.CRU.000001", value: "4.UR002.CRU.000001" },
    { placeholder: "Base Algodão 30/1", value: "Base Poliéster 40/1" },
  ],
  handler: ({ method, url }) => {
    if (method === "GET" && url === "/api/cadastros/fios") return { json: [] }
    return { status: 404, json: { error: "Rota não mockada" } }
  },
  createBodyAssert: (body) => {
    expect(body.codigoBase).toBe("UR002")
    expect(body.codigoCompleto).toBe("4.UR002.CRU.000001")
    expect(body.nome).toBe("Base Poliéster 40/1")
    expect(body.fiosLista).toEqual([])
  },
})
