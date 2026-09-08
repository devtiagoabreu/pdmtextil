// @vitest-environment jsdom
import ProcessoEmpresaFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "ProcessoEmpresaFormPage",
  component: <ProcessoEmpresaFormPage />,
  apiBase: "empresas",
  apiPrefix: "/api/processos",
  pagePrefix: "/processos",
  listHref: "/processos/empresas",
  headingNew: "Nova Empresa",
  headingEdit: "Editar Empresa",
  validationToast: "Nome é obrigatório",
  successToastNew: "Empresa criada!",
  successToastEdit: "Empresa atualizada!",
  editId: 5,
  editData: {
    id: 5,
    nome: "PDM Têxtil",
    cnpj: "12.345.678/0001-90",
    segmento: "Têxtil",
    observacoes: "Matriz",
    ativo: true,
  },
  editDisplayValue: "PDM Têxtil",
  createFields: [
    { placeholder: "PDM Têxtil", value: "PDM Processos Ltda" },
    { placeholder: "00.000.000/0001-00", value: "00.111.222/0001-33" },
  ],
  createBodyAssert: (body) => {
    expect(body.nome).toBe("PDM Processos Ltda")
    expect(body.cnpj).toBe("00.111.222/0001-33")
    expect(body.ativo).toBe(true)
  },
})