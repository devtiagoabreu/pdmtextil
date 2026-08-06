// @vitest-environment jsdom
import EstampaFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "EstampaFormPage",
  component: <EstampaFormPage />,
  apiBase: "estampas",
  listHref: "/cadastros/estampas",
  headingNew: "Nova Estampa",
  headingEdit: "Editar Estampa",
  validationToast: "Código do Desenho e Nome são obrigatórios",
  successToastNew: "Estampa criada!",
  successToastEdit: "Estampa atualizada!",
  editId: 2,
  editData: {
    id: 2,
    codigoDesenho: "5001",
    variante: "01",
    nome: "Floral Botânico",
    tipo: "FLORAL",
    ativo: true,
    idIntegracao: "ERP-E1",
  },
  editDisplayValue: "Floral Botânico",
  createFields: [
    { placeholder: "5001", value: "5002" },
    { placeholder: "Floral Botânico", value: "Listrado Marinho" },
  ],
  createBodyAssert: (body) => {
    expect(body.codigoDesenho).toBe("5002")
    expect(body.nome).toBe("Listrado Marinho")
    expect(body.variante).toBe("01")
    expect(body.ativo).toBe(true)
  },
})
