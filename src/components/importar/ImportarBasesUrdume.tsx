"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarBasesUrdume({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Bases Urdume", apiBase: "cadastros/bases-urdume", arquivoPrefixo: "bases_urdume" }}
      onImportado={onImportado}
    />
  )
}
