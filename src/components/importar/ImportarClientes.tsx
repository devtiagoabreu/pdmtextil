"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarClientes({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Clientes", apiBase: "cadastros/clientes", arquivoPrefixo: "clientes" }}
      onImportado={onImportado}
    />
  )
}
