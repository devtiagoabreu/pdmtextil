"use client"

import { ImportarEntidade } from "./ImportarEntidade"

interface ImportarContatosEmailProps {
  listaId: number
  listaNome: string
  onImportado?: () => void
}

export default function ImportarContatosEmail({ listaId, listaNome, onImportado }: ImportarContatosEmailProps) {
  return (
    <ImportarEntidade
      config={{
        titulo: "Contatos",
        apiBase: `admin/email-massa/listas/${listaId}`,
        arquivoPrefixo: "contatos_email",
      }}
      onImportado={onImportado}
      buttonVariant="compact"
      titleSuffix={listaNome}
      apiImportConfig={{
        tela: "email-listas",
        existingKey: "email",
        extraImportParams: { listaId },
      }}
    />
  )
}
