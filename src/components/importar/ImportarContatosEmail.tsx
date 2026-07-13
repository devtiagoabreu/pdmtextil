"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, FileJson, X, Loader2, Database } from "lucide-react"
import { toast } from "sonner"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"

interface ImportarContatosEmailProps {
  listaId: number
  listaNome: string
  onImportado?: () => void
}

interface ResultadoImport {
  total: number
  importados: number
  erros: { linha: number; erro: string }[]
}

export default function ImportarContatosEmail({ listaId, listaNome, onImportado }: ImportarContatosEmailProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [modo, setModo] = useState<"arquivo" | "api">("arquivo")
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImport | null>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [showApiImport, setShowApiImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baixarModeloCSV = async () => {
    try {
      const res = await fetch("/api/admin/email-massa/listas/modelo?formato=csv")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "contatos_email_modelo.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Modelo CSV baixado!")
    } catch {
      toast.error("Erro ao baixar modelo CSV")
    }
  }

  const baixarModeloJSON = async () => {
    try {
      const res = await fetch("/api/admin/email-massa/listas/modelo?formato=json")
      const dados = await res.json()
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "contatos_email_modelo.json"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Modelo JSON baixado!")
    } catch {
      toast.error("Erro ao baixar modelo JSON")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivoSelecionado(file)
      setResultado(null)
    }
  }

  const handleImportarArquivo = async () => {
    if (!arquivoSelecionado) {
      toast.error("Selecione um arquivo primeiro")
      return
    }

    setImportando(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivoSelecionado)

      const res = await fetch(`/api/admin/email-massa/listas/${listaId}/importar`, {
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
      toast.error(error.message || "Erro ao importar arquivo")
    } finally {
      setImportando(false)
    }
  }

  const abrirModal = () => {
    setArquivoSelecionado(null)
    setResultado(null)
    setModo("arquivo")
    setModalAberto(true)
  }

  return (
    <>
      <button
        onClick={abrirModal}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
      >
        <Upload size={12} />
        Importar
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-semibold">Importar Contatos — {listaNome}</h2>
              <button onClick={() => setModalAberto(false)} className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {/* Mode tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setModo("arquivo")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    modo === "arquivo"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Upload size={14} className="inline mr-1" /> Arquivo CSV/JSON
                </button>
                <button
                  onClick={() => setModo("api")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    modo === "api"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Database size={14} className="inline mr-1" /> Via API
                </button>
              </div>

              {modo === "arquivo" ? (
                <div className="mt-4 space-y-4">
                  {/* Download models row */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Baixar modelo</span>
                      <p className="text-xs text-slate-400 mt-0.5">Campos: <strong>nome</strong>, <strong>email</strong></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={baixarModeloCSV}
                        className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                        <FileSpreadsheet size={14} className="text-blue-600" /> CSV
                      </button>
                      <button onClick={baixarModeloJSON}
                        className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                        <FileJson size={14} className="text-purple-600" /> JSON
                      </button>
                    </div>
                  </div>

                  {/* Upload dashed zone */}
                  <input ref={fileInputRef} type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                    {arquivoSelecionado ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileSpreadsheet className="text-green-600" size={36} />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{arquivoSelecionado.name}</span>
                        <span className="text-xs text-slate-500">{(arquivoSelecionado.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="text-slate-400" size={36} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Clique para selecionar</span>
                        <span className="text-xs text-slate-400">CSV ou JSON</span>
                      </div>
                    )}
                  </button>

                  {/* Result */}
                  {resultado && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Resultado:</span>
                        <span className="text-sm text-green-600 font-semibold">{resultado.importados} importados</span>
                        {resultado.total - resultado.importados > 0 && (
                          <span className="text-sm text-red-500 font-semibold">{resultado.total - resultado.importados} erros</span>
                        )}
                      </div>
                      {resultado.erros.length > 0 && (
                        <div className="mt-2 max-h-28 overflow-y-auto text-xs space-y-0.5">
                          {resultado.erros.slice(0, 10).map((erro, i) => (
                            <p key={i} className="text-red-500">Linha {erro.linha}: {erro.erro}</p>
                          ))}
                          {resultado.erros.length > 10 && (
                            <p className="text-slate-500 mt-1">... e mais {resultado.erros.length - 10} erros</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setModalAberto(false)}
                      className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                      Fechar
                    </button>
                    <button onClick={handleImportarArquivo} disabled={!arquivoSelecionado || importando}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                      {importando && <Loader2 size={16} className="animate-spin" />}
                      {importando ? "Importando..." : "Importar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-500 mb-4">
                    Importar contatos via integração com API externa.
                  </p>
                  <button
                    onClick={() => { setShowApiImport(true); setModalAberto(false) }}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <Database size={16} /> Abrir Importação via API
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showApiImport && (
        <ImportarApiModal
          tela="email-listas"
          existingRecords={[]}
          existingKey="email"
          onImportado={() => { setShowApiImport(false); onImportado?.() }}
          onClose={() => setShowApiImport(false)}
          extraImportParams={{ listaId }}
        />
      )}
    </>
  )
}
