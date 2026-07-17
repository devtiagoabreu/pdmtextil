"use client"

import { ImportarEntidade } from "./ImportarEntidade"

export default function ImportarProdutosQuimicos({ onImportado }: { onImportado?: () => void }) {
  return (
    <ImportarEntidade
      config={{
        titulo: "Produtos Químicos",
        apiBase: "cadastros/produtos-quimicos",
        arquivoPrefixo: "produtos_quimicos",
        formDataKey: "file",
        showModelDownloads: false,
        colunasHint: "Colunas: código, nome, descricao, categoria, unidadePadrao, tipo, concentracao, idIntegracao",
        normalizeResponse: (data) => ({
          total: data.imported + (data.errors?.length || 0),
          importados: data.imported,
          erros: (data.errors || []).map((e: string, i: number) => ({ linha: i + 1, erro: e })),
        }),
        mensagemSucesso: (n) => `${n} produtos químicos importados`,
      }}
      onImportado={onImportado}
    />
  )
}
