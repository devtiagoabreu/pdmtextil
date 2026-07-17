"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarFornecedores({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Fornecedores", apiBase: "cadastros/fornecedores", arquivoPrefixo: "fornecedores" }}
      onImportado={onImportado}
    />
  )
}
