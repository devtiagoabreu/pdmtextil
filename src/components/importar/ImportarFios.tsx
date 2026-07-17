"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarFios({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Fios", apiBase: "cadastros/fios", arquivoPrefixo: "fios" }}
      onImportado={onImportado}
    />
  )
}
