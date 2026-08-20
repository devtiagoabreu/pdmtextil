"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Upload, Loader2, X, Check, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface OcrItem {
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
}

interface OcrInputProps {
  onItensImportados: (itens: OcrItem[]) => void
}

function parseTextoEmItens(texto: string): OcrItem[] {
  const linhas = texto.split("\n").filter((l: string) => l.trim())
  if (linhas.length === 0) return []

  const itens: OcrItem[] = []

  for (const linha of linhas) {
    const cols = linha.split(/\t+|\s{2,}/).map((c: string) => c.trim()).filter(Boolean)

    if (cols.length >= 6) {
      itens.push({
        codigoProduto: cols[0] || "",
        ordem: cols[1] || "",
        artigo: cols[2] || "",
        cor: cols[3] || "",
        desenho: cols[4] || "",
        quantidade: cols[5] || "",
      })
    } else if (cols.length === 5) {
      itens.push({
        codigoProduto: cols[0] || "",
        ordem: cols[1] || "",
        artigo: cols[2] || "",
        cor: cols[3] || "",
        desenho: "",
        quantidade: cols[4] || "",
      })
    } else if (cols.length === 4) {
      itens.push({
        codigoProduto: cols[0] || "",
        ordem: "",
        artigo: cols[1] || "",
        cor: cols[2] || "",
        desenho: "",
        quantidade: cols[3] || "",
      })
    } else if (cols.length === 3) {
      itens.push({
        codigoProduto: cols[0] || "",
        ordem: "",
        artigo: "",
        cor: cols[1] || "",
        desenho: "",
        quantidade: cols[2] || "",
      })
    } else if (cols.length === 2) {
      itens.push({
        codigoProduto: cols[0] || "",
        ordem: "",
        artigo: "",
        cor: "",
        desenho: "",
        quantidade: cols[1] || "",
      })
    } else if (cols.length === 1) {
      itens.push({
        codigoProduto: "",
        ordem: "",
        artigo: "",
        cor: "",
        desenho: "",
        quantidade: cols[0] || "",
      })
    }
  }

  return itens
}

export default function OcrInput({ onItensImportados }: OcrInputProps) {
  const [aberto, setAberto] = useState(false)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [textoExtraido, setTextoExtraido] = useState("")
  const [etapa, setEtapa] = useState<"selecao" | "preview" | "texto">("selecao")
  const fileInputCameraRef = useRef<HTMLInputElement>(null)
  const fileInputGaleriaRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagemPreview(ev.target?.result as string)
      setEtapa("preview")
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }, [])

  async function processarOCR() {
    if (!imagemPreview) return

    setProcessando(true)
    setProgresso(0)
    setEtapa("texto")

    try {
      const Tesseract = await import("tesseract.js")
      const worker = await Tesseract.createWorker("por", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setProgresso(Math.round(m.progress * 100))
          }
        },
      })

      const { data } = await worker.recognize(imagemPreview)
      setTextoExtraido(data.text)
      await worker.terminate()
    } catch (err) {
      console.error("OCR error:", err)
      toast.error("Erro ao processar imagem. Tente novamente.")
      setEtapa("preview")
    } finally {
      setProcessando(false)
      setProgresso(0)
    }
  }

  function importarItens() {
    const itens = parseTextoEmItens(textoExtraido)
    if (itens.length === 0) {
      toast.error("Nenhum item identificado no texto. Ajuste o texto manualmente.")
      return
    }
    onItensImportados(itens)
    toast.success(`${itens.length} item(ns) importado(s) via OCR`)
    fechar()
  }

  function fechar() {
    setAberto(false)
    setImagemPreview(null)
    setTextoExtraido("")
    setEtapa("selecao")
    setProcessando(false)
    setProgresso(0)
  }

  return (
    <>
      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputGaleriaRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAberto(true)}
        className="gap-1"
      >
        <Camera size={14} />
        Inserir por OCR
      </Button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Inserir itens por OCR
              </h3>
              <button onClick={fechar} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {etapa === "selecao" && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Tire uma foto ou selecione uma imagem com os dados de corte.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputCameraRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <Camera size={28} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tirar Foto</span>
                      <span className="text-xs text-slate-400">Câmera do celular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputGaleriaRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <Upload size={28} className="text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecionar</span>
                      <span className="text-xs text-slate-400">Galeria ou arquivo</span>
                    </button>
                  </div>
                </div>
              )}

              {etapa === "preview" && imagemPreview && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={imagemPreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setEtapa("selecao"); setImagemPreview(null) }}
                    >
                      Outra foto
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={processarOCR}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                    >
                      <ImageIcon size={14} />
                      Extrair texto
                    </Button>
                  </div>
                </div>
              )}

              {etapa === "texto" && (
                <div className="space-y-3">
                  {processando && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Processando imagem... {progresso}%
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!processando && (
                    <>
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Texto extraído — revise e ajuste antes de importar
                        </span>
                      </div>
                      <Textarea
                        value={textoExtraido}
                        onChange={(e) => setTextoExtraido(e.target.value)}
                        rows={10}
                        className="text-xs font-mono"
                        placeholder="Texto extraído pelo OCR aparecerá aqui..."
                      />
                      <p className="text-xs text-slate-400">
                        Dica: os dados são separados por colunas (tab ou espaços). Cada linha vira um item.
                      </p>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setEtapa("preview"); setTextoExtraido("") }}
                        >
                          Processar novamente
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={importarItens}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                        >
                          <Check size={14} />
                          Importar Itens
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
