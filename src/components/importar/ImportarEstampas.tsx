"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarEstampas({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{ titulo: "Estampas", apiBase: "cadastros/estampas", arquivoPrefixo: "estampas" }}
      onImportado={onImportado}
    />
  )
}
