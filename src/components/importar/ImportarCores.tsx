"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarCores({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Cores", apiBase: "cadastros/cores", arquivoPrefixo: "cores" }}
      onImportado={onImportado}
    />
  )
}
