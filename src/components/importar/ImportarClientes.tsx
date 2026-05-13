"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, FileJson, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ImportarClientesProps {
  onImportado?: () => void
}

interface ResultadoImport {
  total: number
  importados: number
  erros: { linha: number; erro: string }[]
}

export default function ImportarClientes({ onImportado }: ImportarClientesProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImport | null>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baixarModeloCSV = async () => {
    try {
      const res = await fetch("/api/cadastros/clientes/modelo?formato=csv")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "clientes_modelo.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Modelo CSV baixado!")
    } catch {
      toast.error("Erro ao baixar modelo CSV")
    }
  }

  const baixarModeloJSON = async () => {
    try {
      const res = await fetch("/api/cadastros/clientes/modelo?formato=json")
      const dados = await res.json()
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "clientes_modelo.json"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Modelo JSON baixado!")
    } catch {
      toast.error("Erro ao baixar modelo JSON")
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivoSelecionado(file)
      setResultado(null)
    }
  }

  const handleImportar = async () => {
    if (!arquivoSelecionado) {
      toast.error("Selecione um arquivo primeiro")
      return
    }

    setImportando(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivoSelecionado)

      const res = await fetch("/api/cadastros/clientes/importar", {
        method: "POST",
        body: formData,
      })

      const dados = await res.json()

      if (!res.ok) {
        throw new Error(dados.error || "Erro ao importar")
      }

      setResultado(dados)
      toast.success(dados.mensagem)

      if (dados.importados > 0 && onImportado) {
        onImportado()
      }
    } catch (error: any) {
      console.error("[ImportarClientes] Erro:", error)
      toast.error(error.message || "Erro ao importar arquivo")
    } finally {
      setImportando(false)
    }
  }

  const abrirModal = () => {
    setArquivoSelecionado(null)
    setResultado(null)
    setModalAberto(true)
  }

  return (
    <>
      <button
        onClick={abrirModal}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
      >
        <Upload size={16} />
        Importar
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-semibold">Importar Clientes</h2>
              <button
                onClick={() => setModalAberto(false)}
                className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                <h3 className="font-medium mb-2">Baixar modelos de arquivo:</h3>
                <div className="flex gap-2">
                  <button
                    onClick={baixarModeloCSV}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <FileSpreadsheet size={16} />
                    CSV
                  </button>
                  <button
                    onClick={baixarModeloJSON}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                  >
                    <FileJson size={16} />
                    JSON
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Preencha o arquivo com os dados e importe abaixo
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Selecionar arquivo (CSV ou JSON)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 text-center hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {arquivoSelecionado ? (
                    <div>
                      <FileSpreadsheet className="mx-auto mb-2 text-green-600" size={32} />
                      <p className="text-sm font-medium">{arquivoSelecionado.name}</p>
                      <p className="text-xs text-slate-500">
                        {(arquivoSelecionado.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                      <p className="text-sm text-slate-500">Clique para selecionar arquivo</p>
                      <p className="text-xs text-slate-400">CSV ou JSON</p>
                    </div>
                  )}
                </button>
              </div>

              {resultado && (
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
                  <h3 className="font-medium mb-2">Resultado da importação:</h3>
                  <p className="text-sm">
                    <span className="text-green-600 font-semibold">{resultado.importados}</span> importados
                    {resultado.total - resultado.importados > 0 && (
                      <span className="text-red-500 ml-2">
                        {resultado.total - resultado.importados} erros
                      </span>
                    )}
                  </p>
                  {resultado.erros.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                      {resultado.erros.slice(0, 10).map((erro, i) => (
                        <p key={i} className="text-red-500">
                          Linha {erro.linha}: {erro.erro}
                        </p>
                      ))}
                      {resultado.erros.length > 10 && (
                        <p className="text-slate-500 mt-1">
                          ... e mais {resultado.erros.length - 10} erros
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 p-4">
              <button
                onClick={() => setModalAberto(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                onClick={handleImportar}
                disabled={!arquivoSelecionado || importando}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importando && <Loader2 size={16} className="animate-spin" />}
                {importando ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}