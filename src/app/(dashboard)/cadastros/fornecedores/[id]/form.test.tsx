// @vitest-environment jsdom
import FornecedorFormPage from "./page"
import { formPageSpec } from "@/test/form-page-spec"
import { expect } from "vitest"

formPageSpec({
  title: "FornecedorFormPage",
  component: <FornecedorFormPage />,
  apiBase: "fornecedores",
  listHref: "/cadastros/fornecedores",
  headingNew: "Novo Fornecedor",
  headingEdit: "Editar Fornecedor",
  validationToast: "Nome é obrigatório",
  successToastNew: "Fornecedor criado!",
  successToastEdit: "Fornecedor atualizado!",
  editId: 5,
  editData: {
    id: 5,
    nome: "Tecidos Silva",
    cnpj: "11.222.333/0001-44",
    razaoSocial: "Tecidos Silva Ltda",
    email: "contato@tecidos.com",
    telefone: "(11) 4000-0000",
    contato: "João",
    endereco: "Rua A, 100",
    cidade: "São Paulo",
    uf: "SP",
    ativo: true,
    idIntegracao: "ERP-001",
  },
  editDisplayValue: "Tecidos Silva",
  createFields: [
    { placeholder: "Fornecedor XYZ", value: "Novo Forn" },
    { placeholder: "00.000.000/0001-00", value: "00.111.222/0001-33" },
  ],
  createBodyAssert: (body) => {
    expect(body.nome).toBe("Novo Forn")
    expect(body.cnpj).toBe("00.111.222/0001-33")
    expect(body.ativo).toBe(true)
  },
})
